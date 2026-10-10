"""Validate complete HTML exports before writing any archive entries."""

from __future__ import annotations

import io
import re
import shutil
import stat
import zipfile
import zlib
from pathlib import Path, PurePosixPath

from fastapi import HTTPException

MAX_EXPANDED_SIZE = 200 * 1024 * 1024
MAX_ARCHIVE_ENTRIES = 2000


def extract_presentation(contents: bytes, destination: Path) -> None:
    try:
        with zipfile.ZipFile(io.BytesIO(contents)) as bundle:
            entries = bundle.infolist()
            if len(entries) > MAX_ARCHIVE_ENTRIES:
                raise HTTPException(400, "ZIP contains too many files (maximum 2000)")
            if sum(entry.file_size for entry in entries) > MAX_EXPANDED_SIZE:
                raise HTTPException(400, "ZIP expanded size exceeds the 200 MB limit")

            names = set()
            files = []
            for entry in entries:
                name = entry.filename
                path = PurePosixPath(name)
                if (
                    not name or "\x00" in entry.orig_filename or "\\" in name
                    or path.is_absolute() or ".." in path.parts
                    or re.match(r"^[A-Za-z]:", name)
                ):
                    raise HTTPException(400, "ZIP contains an unsafe path")
                if stat.S_ISLNK(entry.external_attr >> 16):
                    raise HTTPException(400, "ZIP symbolic links are not allowed")
                if entry.flag_bits & 1:
                    raise HTTPException(400, "Encrypted ZIP files are not supported")
                if path.as_posix() in names:
                    raise HTTPException(400, "ZIP contains duplicate paths")
                names.add(path.as_posix())
                if not entry.is_dir() and "__MACOSX" not in path.parts and path.name != ".DS_Store":
                    files.append((entry, path))

            file_paths = {path for _, path in files}
            if any(parent in file_paths for path in file_paths for parent in path.parents):
                raise HTTPException(400, "ZIP contains a file/directory path conflict")

            indexes = [path for _, path in files if path.name == "index.html"]
            if len(indexes) != 1 or len(indexes[0].parts) > 2:
                raise HTTPException(
                    400, "ZIP must contain one index.html at the root or inside one folder"
                )
            root = indexes[0].parent
            if any(not path.is_relative_to(root) for _, path in files):
                raise HTTPException(400, "ZIP files must belong to the presentation folder")

            destination.mkdir(parents=True)
            expanded = 0
            for entry, path in files:
                target = destination / path.relative_to(root)
                target.parent.mkdir(parents=True, exist_ok=True)
                with bundle.open(entry) as source, target.open("wb") as output:
                    while chunk := source.read(1024 * 1024):
                        expanded += len(chunk)
                        if expanded > MAX_EXPANDED_SIZE:
                            raise HTTPException(400, "ZIP expanded size exceeds the 200 MB limit")
                        output.write(chunk)
    except (zipfile.BadZipFile, NotImplementedError, RuntimeError, EOFError, zlib.error) as exc:
        raise HTTPException(400, "Invalid or unsupported ZIP presentation") from exc


def remove_owned_directory(directory: Path) -> None:
    if directory.is_dir():
        shutil.rmtree(directory)
    parent = directory.parent
    if parent.is_dir() and not any(parent.iterdir()):
        parent.rmdir()
