"""Connect compatible exports without changing their stored files."""

import re
from collections.abc import Iterator
from pathlib import Path

_HEAD = re.compile(rb"</head\s{0,16}>", re.IGNORECASE)
_READY = re.compile(
    rb"function\s{1,32}onPlayerInit\s{0,32}\(\s{0,32}player\s{0,32}\)\s{0,32}\{"
)
_SCRIPT = b'<script src="/api/v1/presentations/player-bridge.js"></script>'
_REGISTER = (
    b"if(window.gmathPresentationBridge){window.gmathPresentationBridge.register(player);}"
)


def is_ispring_presentation(path: Path) -> bool:
    with path.open("rb") as source:
        prefix = source.read(64 * 1024)
    return b"data/player.js" in prefix and b"ispring.compatibility" in prefix


def instrument_presentation(path: Path, chunk_size: int = 64 * 1024) -> Iterator[bytes]:
    # Keep enough overlap for a bootstrap signature split across read boundaries.
    pending = b""
    head_done = ready_done = False
    with path.open("rb") as source:
        while chunk := source.read(chunk_size):
            pending += chunk
            if not head_done:
                pending, count = _HEAD.subn(lambda match: _SCRIPT + match[0], pending, count=1)
                head_done = bool(count)
            if not ready_done:
                pending, count = _READY.subn(
                    lambda match: match[0] + _REGISTER, pending, count=1
                )
                ready_done = bool(count)
            if len(pending) > 256:
                yield pending[:-256]
                pending = pending[-256:]
        yield pending
