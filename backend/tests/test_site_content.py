"""Public home-page content built from site_config."""

import uuid

from httpx import AsyncClient

from app.services.site_content import DEFAULT_SITE_CONTENT, build_site_content


def test_defaults_when_keys_missing():
    content = build_site_content({}, "en")
    assert content["trust_cards"][0] == {
        "icon": "🏛️",
        "text": "Approved by the Ministry of Education",
    }
    assert len(content["trust_cards"]) == 3
    assert content["about"]["button_link"] == "/about-mathematics"
    assert content["about"]["title"].startswith("G-math")


def test_localized_value_wins():
    content = build_site_content({"home.about.title_ar": "عنوان"}, "ar")
    assert content["about"]["title"] == "عنوان"


def test_empty_locale_value_falls_back_to_hebrew():
    settings = {"home.trust.2.text_he": "עברית בלבד", "home.trust.2.text_en": ""}
    content = build_site_content(settings, "en")
    assert content["trust_cards"][1]["text"] == "עברית בלבד"


def test_every_default_key_is_namespaced():
    assert all(key.startswith("home.") for key in DEFAULT_SITE_CONTENT)
    assert "home.trust.3.icon" in DEFAULT_SITE_CONTENT


async def test_endpoint_reflects_admin_settings(async_client: AsyncClient, admin_token: str):
    value = f"Trust {uuid.uuid4().hex[:6]}"
    saved = await async_client.put(
        "/api/v1/admin/settings",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"settings": {"home.trust.3.text_en": value}},
    )
    assert saved.status_code == 200

    resp = await async_client.get("/api/v1/site-content?locale=en")
    assert resp.status_code == 200
    body = resp.json()
    assert body["trust_cards"][2]["text"] == value
    assert set(body["about"]) == {"title", "body", "button_text", "button_link"}


async def test_endpoint_rejects_unknown_locale(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/site-content?locale=fr")
    assert resp.status_code == 422
