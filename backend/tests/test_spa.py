from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.spa import mount_frontends


def _build_app(tmp_path) -> FastAPI:
    for name in ("public", "admin"):
        (tmp_path / name / "assets").mkdir(parents=True)
        (tmp_path / name / "index.html").write_text(f"<html>{name}</html>")
        (tmp_path / name / "assets" / "app.js").write_text("console.log(1)")

    app = FastAPI()

    @app.get("/api/v1/ping")
    async def ping():
        return {"ok": True}

    mount_frontends(app, tmp_path)
    return app


async def _get(app: FastAPI, path: str):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        return await client.get(path)


async def test_root_and_client_routes_serve_public_index(tmp_path):
    app = _build_app(tmp_path)
    for path in ("/", "/algebra/linear/lesson-1"):
        res = await _get(app, path)
        assert res.status_code == 200
        assert "public" in res.text
        assert res.headers["cache-control"] == "no-cache"


async def test_admin_routes_serve_admin_index(tmp_path):
    app = _build_app(tmp_path)
    for path in ("/admin/", "/admin/login", "/admin/topics"):
        res = await _get(app, path)
        assert res.status_code == 200
        assert "admin" in res.text


async def test_api_routes_take_precedence_and_unknown_api_is_json_404(tmp_path):
    app = _build_app(tmp_path)
    assert (await _get(app, "/api/v1/ping")).json() == {"ok": True}
    res = await _get(app, "/api/v1/nope")
    assert res.status_code == 404
    assert "<html>" not in res.text


async def test_assets_are_immutable_and_missing_assets_404(tmp_path):
    app = _build_app(tmp_path)
    res = await _get(app, "/assets/app.js")
    assert res.status_code == 200
    assert "immutable" in res.headers["cache-control"]
    assert (await _get(app, "/assets/missing.js")).status_code == 404


async def test_no_mount_without_build(tmp_path):
    app = FastAPI()
    mount_frontends(app, tmp_path)
    assert (await _get(app, "/")).status_code == 404
