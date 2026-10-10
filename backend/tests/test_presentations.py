"""Named ZIP presentations, their owned assets and lesson association."""

import io
import stat
import zipfile
from pathlib import Path

import pytest

from app.config import settings
from app.models.lesson import Lesson
from tests.test_files import _seed_lesson


def archive(entries=None):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as bundle:
        for name, contents in (entries or {
            "מצגת (Web)/index.html": '<script src="data/player.js"></script>',
            "מצגת (Web)/data/player.js": "window.slide = 1;",
            "מצגת (Web)/data/font.woff": b"font",
        }).items():
            bundle.writestr(name, contents)
    return buffer.getvalue()


async def upload(client, token, lesson_id, contents=None, name="Common factor"):
    data = {"lesson_id": str(lesson_id), "file_type": "presentation"}
    if name is not None:
        data["display_name"] = name
    return await client.post(
        "/api/v1/admin/files/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("slides.zip", contents or archive(), "application/zip")},
        data=data,
    )


async def test_named_wrapped_zip_is_playable(async_client, db_session, admin_token):
    lesson_id = await _seed_lesson(db_session)
    response = await upload(async_client, admin_token, lesson_id, name="  גורם משותף  ")
    assert response.status_code == 201, response.text
    record = response.json()
    assert record["display_name"] == "גורם משותף"
    assert record["lesson_id"] == str(lesson_id)
    assert record["file_url"].endswith("/index.html")
    page = await async_client.get(record["file_url"])
    assert page.status_code == 200
    assert "data/player.js" in page.text
    assert page.headers["content-type"].startswith("text/html")
    assert "sandbox allow-scripts" in page.headers["content-security-policy"]
    assert "allow-same-origin" not in page.headers["content-security-policy"]
    assert "http://localhost:5173" in page.headers["content-security-policy"]
    script = await async_client.get(record["file_url"].replace("index.html", "data/player.js"))
    assert script.status_code == 200
    assert script.text == "window.slide = 1;"
    font = await async_client.get(record["file_url"].replace("index.html", "data/font.woff"))
    assert font.status_code == 200
    assert font.headers["access-control-allow-origin"] == "*"


async def test_root_zip_and_original_download(async_client, db_session, admin_token):
    lesson_id = await _seed_lesson(db_session)
    bundle = archive({"index.html": "<h1>Slides</h1>", "data/a.png": b"image"})
    response = await upload(async_client, admin_token, lesson_id, contents=bundle)
    assert response.status_code == 201, response.text
    record = response.json()
    download = await async_client.get(
        f"/api/v1/admin/files/{record['id']}/download",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert download.status_code == 200
    assert download.content == bundle
    assert "zip" in download.headers["content-disposition"]
    assert (await async_client.get(
        record["file_url"].replace("index.html", "original.zip")
    )).status_code == 404


@pytest.mark.parametrize("name", [None, "", "   ", "x" * 301])
async def test_zip_requires_valid_display_name(async_client, db_session, admin_token, name):
    response = await upload(async_client, admin_token, await _seed_lesson(db_session), name=name)
    assert response.status_code in (400, 422)
    assert "name" in response.text.lower()


async def test_zip_is_only_a_presentation(async_client, db_session, admin_token):
    response = await async_client.post(
        "/api/v1/admin/files/upload",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("slides.zip", archive(), "application/zip")},
        data={"lesson_id": str(await _seed_lesson(db_session)),
              "file_type": "worksheet", "display_name": "Bad type"},
    )
    assert response.status_code == 400
    assert "presentation" in response.text.lower()


@pytest.mark.parametrize("entries", [
    {"../index.html": "bad"},
    {"/index.html": "bad"},
    {"C:/index.html": "bad"},
    {"slides\\index.html": "bad"},
    {"index.html": "ok", "data/../../escape.js": "bad"},
    {"index.html": "ok", "folder/other/index.html": "ambiguous"},
    {"readme.txt": "no entry"},
])
async def test_rejects_unsafe_or_ambiguous_archives(
    async_client, db_session, admin_token, entries
):
    lesson_id = await _seed_lesson(db_session)
    response = await upload(async_client, admin_token, lesson_id, contents=archive(entries))
    assert response.status_code == 400, response.text
    assert not (Path(settings.media_root) / ".presentations" / str(lesson_id)).exists()


async def test_rejects_symlink(async_client, db_session, admin_token):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as bundle:
        bundle.writestr("index.html", "<h1>Slides</h1>")
        entry = zipfile.ZipInfo("data/link")
        entry.create_system = 3
        entry.external_attr = (stat.S_IFLNK | 0o777) << 16
        bundle.writestr(entry, "/etc/passwd")
    response = await upload(
        async_client, admin_token, await _seed_lesson(db_session), contents=buffer.getvalue()
    )
    assert response.status_code == 400
    assert "symbolic" in response.text.lower()


async def test_rejects_invalid_zip(async_client, db_session, admin_token):
    response = await upload(
        async_client, admin_token, await _seed_lesson(db_session), contents=b"not a zip"
    )
    assert response.status_code == 400
    assert "ZIP" in response.text


async def test_multiple_presentations_never_overwrite(async_client, db_session, admin_token):
    lesson_id = await _seed_lesson(db_session)
    first = (await upload(async_client, admin_token, lesson_id, name="First")).json()
    second = (await upload(async_client, admin_token, lesson_id, name="Second")).json()
    assert "id" in first and "id" in second, (first, second)
    assert first["file_url"] != second["file_url"]
    assert second["sort_order"] > first["sort_order"]
    remove = await async_client.delete(
        f"/api/v1/admin/files/{first['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert remove.status_code == 204
    assert (await async_client.get(first["file_url"])).status_code == 404
    assert (await async_client.get(second["file_url"])).status_code == 200
    directory = Path(settings.media_root) / ".presentations" / str(lesson_id) / first["id"]
    assert not directory.exists()


async def test_rename_and_order_are_lesson_scoped(async_client, db_session, admin_token):
    lesson_id = await _seed_lesson(db_session)
    headers = {"Authorization": f"Bearer {admin_token}"}
    first_response = await upload(async_client, admin_token, lesson_id, name="First")
    assert first_response.status_code == 201, first_response.text
    first = first_response.json()
    second = (await upload(async_client, admin_token, lesson_id, name="Second")).json()
    renamed = await async_client.patch(
        f"/api/v1/admin/files/{first['id']}",
        headers=headers, json={"display_name": "Renamed"},
    )
    assert renamed.status_code == 200
    assert renamed.json()["display_name"] == "Renamed"
    assert (await async_client.patch(
        f"/api/v1/admin/files/{first['id']}", headers=headers,
        json={"display_name": "   "},
    )).status_code == 422
    order_url = f"/api/v1/admin/files/lesson/{lesson_id}/order"
    assert (await async_client.put(
        order_url, headers=headers, json={"file_ids": [second["id"], first["id"]]},
    )).status_code == 200
    listed = await async_client.get(
        f"/api/v1/admin/files/lesson/{lesson_id}", headers=headers
    )
    assert [item["id"] for item in listed.json()] == [second["id"], first["id"]]
    assert (await async_client.put(
        order_url, headers=headers, json={"file_ids": [first["id"]]},
    )).status_code == 400
    other_lesson = await _seed_lesson(db_session)
    assert (await async_client.put(
        f"/api/v1/admin/files/lesson/{other_lesson}/order", headers=headers,
        json={"file_ids": [first["id"]]},
    )).status_code == 400


async def test_asset_paths_cannot_escape_upload(async_client, db_session, admin_token):
    result = await upload(async_client, admin_token, await _seed_lesson(db_session))
    assert result.status_code == 201, result.text
    base = result.json()["file_url"].removesuffix("index.html")
    for path in ["%2e%2e/original.zip", "%2e%2e/%2e%2e/anything", "data/%5c..%5csecret"]:
        assert (await async_client.get(base + path)).status_code == 404
    assert (await async_client.get(base + "missing.js")).status_code == 404


async def test_rejects_excessive_expanded_archive(
    async_client, db_session, admin_token, monkeypatch
):
    monkeypatch.setattr("app.services.presentations.MAX_EXPANDED_SIZE", 32)
    result = await upload(
        async_client, admin_token, await _seed_lesson(db_session),
        contents=archive({"index.html": "x" * 33}),
    )
    assert result.status_code == 400
    assert "expanded" in result.text.lower()


async def test_failed_commit_cleans_owned_upload(db_session, monkeypatch):
    from fastapi import UploadFile

    from app.models.content import FileType
    from app.services.files import save_upload

    lesson_id = await _seed_lesson(db_session)

    async def fail_commit():
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(db_session, "commit", fail_commit)
    with pytest.raises(RuntimeError, match="database unavailable"):
        await save_upload(
            db_session, UploadFile(filename="slides.zip", file=io.BytesIO(archive())),
            lesson_id, FileType.presentation, display_name="Named",
        )
    lesson_dir = Path(settings.media_root) / ".presentations" / str(lesson_id)
    assert not lesson_dir.exists() or not list(lesson_dir.iterdir())


async def test_lesson_deletion_removes_owned_presentations(async_client, db_session, admin_token):
    lesson_id = await _seed_lesson(db_session)
    result = await upload(async_client, admin_token, lesson_id)
    assert result.status_code == 201
    content_id = result.json()["id"]
    response = await async_client.delete(
        f"/api/v1/admin/lessons/{lesson_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 204
    assert not (Path(settings.media_root) / ".presentations" / str(lesson_id) / content_id).exists()


async def test_rejects_file_directory_collision(async_client, db_session, admin_token):
    response = await upload(
        async_client, admin_token, await _seed_lesson(db_session),
        contents=archive({"index.html": "ok", "data": "file", "data/slide.js": "script"}),
    )
    assert response.status_code == 400


async def test_rejects_too_many_archive_entries(
    async_client, db_session, admin_token, monkeypatch
):
    monkeypatch.setattr("app.services.presentations.MAX_ARCHIVE_ENTRIES", 1)
    response = await upload(async_client, admin_token, await _seed_lesson(db_session))
    assert response.status_code == 400
    assert "too many" in response.text.lower()


async def test_rejects_upload_size_limit(async_client, db_session, admin_token, monkeypatch):
    monkeypatch.setattr("app.services.files.MAX_FILE_SIZE", 32)
    response = await upload(async_client, admin_token, await _seed_lesson(db_session))
    assert response.status_code == 400
    assert "maximum size" in response.text


async def test_unicode_asset_names_are_preserved(async_client, db_session, admin_token):
    result = await upload(
        async_client, admin_token, await _seed_lesson(db_session),
        contents=archive({"index.html": "<img src='תמונה.png'>", "תמונה.png": b"image"}),
    )
    assert result.status_code == 201
    response = await async_client.get(result.json()["file_url"].replace("index.html", "תמונה.png"))
    assert response.status_code == 200
    assert response.content == b"image"


async def test_public_lesson_includes_localized_breadcrumb_names(async_client, db_session):
    lesson_id = await _seed_lesson(db_session)
    lesson = await db_session.get(Lesson, lesson_id)
    response = await async_client.get(f"/api/v1/lessons/{lesson.slug}?locale=en")
    assert response.status_code == 200
    assert response.json()["topic_name"] == "Topic"
    assert response.json()["subtopic_name"] == "Sub"


async def test_pdf_response_keeps_native_browser_viewing(async_client, db_session, admin_token):
    result = await async_client.post(
        "/api/v1/admin/files/upload",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("lesson.pdf", b"%PDF-1.4\n", "application/pdf")},
        data={"lesson_id": str(await _seed_lesson(db_session)), "file_type": "presentation"},
    )
    assert result.status_code == 201
    response = await async_client.get(result.json()["file_url"])
    assert response.headers["content-type"].startswith("application/pdf")
    assert "sandbox" not in response.headers["content-security-policy"]
    assert response.headers["x-content-type-options"] == "nosniff"


async def test_corrupt_compressed_data_returns_validation_error(
    async_client, db_session, admin_token
):
    data = bytearray(archive({"index.html": "slides"}))
    with zipfile.ZipFile(io.BytesIO(data)) as bundle:
        entry = bundle.infolist()[0]
        offset = entry.header_offset + 30 + len(entry.filename.encode()) + len(entry.extra)
    data[offset] = 0xff
    result = await upload(
        async_client, admin_token, await _seed_lesson(db_session), contents=bytes(data)
    )
    assert result.status_code == 400
    assert "Invalid or unsupported ZIP" in result.text


async def test_upload_limit_accepts_boundary_and_rejects_next_byte(
    async_client, db_session, admin_token, monkeypatch
):
    monkeypatch.setattr("app.services.files.MAX_FILE_SIZE", 128)
    lesson_id = await _seed_lesson(db_session)
    for size, expected in [(128, 201), (129, 400)]:
        result = await async_client.post(
            "/api/v1/admin/files/upload",
            headers={"Authorization": f"Bearer {admin_token}"},
            files={"file": ("limit.pdf", b"%PDF-" + b"x" * (size - 5), "application/pdf")},
            data={"lesson_id": str(lesson_id), "file_type": "presentation"},
        )
        assert result.status_code == expected


async def test_expanded_limit_accepts_boundary_and_rejects_next_byte(
    async_client, db_session, admin_token, monkeypatch
):
    monkeypatch.setattr("app.services.presentations.MAX_EXPANDED_SIZE", 128)
    lesson_id = await _seed_lesson(db_session)
    for size, expected in [(128, 201), (129, 400)]:
        result = await upload(
            async_client, admin_token, lesson_id, contents=archive({"index.html": "x" * size})
        )
        assert result.status_code == expected


ISPRING_ENTRY = """<!doctype html><html><head>
<script src="data/player.js"></script></head><body>
<script>
ispring.compatibility.performRedirectIfNeeded("data/html5-unsupported.html");
PresentationPlayer.start("data", "content", "playerView", onPlayerInit);
function onPlayerInit(player) { window.originalCallback = player; }
</script></body></html>"""


async def test_ispring_entry_connects_real_player_without_changing_original(
    async_client, db_session, admin_token
):
    bundle = archive({"index.html": ISPRING_ENTRY, "data/player.js": "/* player */"})
    result = await upload(
        async_client, admin_token, await _seed_lesson(db_session), contents=bundle
    )
    assert result.status_code == 201
    record = result.json()
    page = await async_client.get(record["file_url"])
    assert "/api/v1/presentations/player-bridge.js" in page.text
    assert "gmathPresentationBridge.register(player)" in page.text
    assert "window.originalCallback = player" in page.text
    assert "allow-same-origin" not in page.headers["content-security-policy"]
    original = await async_client.get(
        f"/api/v1/admin/files/{record['id']}/download",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert original.content == bundle


async def test_sandboxed_player_can_fetch_only_its_own_assets(
    async_client, db_session, admin_token
):
    # iSpring loads slide CSS via XHR; 'self' never matches the sandbox's opaque origin.
    result = await upload(async_client, admin_token, await _seed_lesson(db_session))
    assert result.status_code == 201, result.text
    base = "http://test" + result.json()["file_url"].removesuffix("index.html")
    policy = (await async_client.get(result.json()["file_url"])).headers[
        "content-security-policy"
    ]
    directives = dict(
        part.strip().split(" ", 1) for part in policy.split(";") if " " in part.strip()
    )
    assert directives["connect-src"].split() == ["'self'", base]
    hostile = await async_client.get(
        result.json()["file_url"], headers={"Host": "evil.test; script-src *"}
    )
    assert "script-src *" not in hostile.headers["content-security-policy"]
    assert "connect-src 'self';" in hostile.headers["content-security-policy"]


async def test_player_bridge_is_javascript_accessible_to_opaque_frames(async_client):
    response = await async_client.get("/api/v1/presentations/player-bridge.js")
    assert response.status_code == 200
    assert "javascript" in response.headers["content-type"]
    assert response.headers["access-control-allow-origin"] == "*"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert "gotoNextSlide" in response.text
    assert "gotoPreviousSlide" in response.text


def test_player_instrumentation_preserves_utf8_and_split_bootstrap(tmp_path):
    from app.services.presentation_player import instrument_presentation, is_ispring_presentation

    original = ISPRING_ENTRY.replace("<body>", "<body>גורם משותף").encode()
    entry = tmp_path / "index.html"
    entry.write_bytes(original)
    assert is_ispring_presentation(entry)
    output = b"".join(instrument_presentation(entry, chunk_size=19))
    assert output.count(b"/api/v1/presentations/player-bridge.js") == 1
    assert output.count(b"gmathPresentationBridge.register(player)") == 1
    assert "גורם משותף".encode() in output
    assert output.endswith(b"</html>")


async def test_generic_html_does_not_get_a_player_adapter(
    async_client, db_session, admin_token
):
    html = "<html><head></head><body>Original content</body></html>"
    result = await upload(
        async_client, admin_token, await _seed_lesson(db_session),
        contents=archive({"index.html": html}),
    )
    page = await async_client.get(result.json()["file_url"])
    assert page.text == html
