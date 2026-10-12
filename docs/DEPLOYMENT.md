# Azure deployment (single App Service)

One Linux App Service (`gmath-api`, Python 3.11) serves everything:

| URL | Served by |
|-----|-----------|
| `/api/v1/*`, `/docs` | FastAPI routes |
| `/admin/*` | admin-frontend build (`backend/web/admin`) |
| `/*` | public frontend build (`backend/web/public`) |

The GitHub Actions workflow builds both Vite apps, copies them into `web/`, and deploys the `backend` folder. Same origin means no CORS or API URL configuration in the frontends — do **not** set `VITE_*` variables in CI.

## App settings (App Service → Environment variables)

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql+asyncpg://USER:PASS@HOST:5432/DB?ssl=require` |
| `JWT_SECRET` | strong random value (`openssl rand -hex 32`) |
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | `https://<your-host>` (site origin; only needed for cross-origin callers) |
| `MEDIA_ROOT` | `/home/media/content` (`/home` persists across restarts and deploys) |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` |

## Startup command (Configuration → Stack settings)

```
gunicorn -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --timeout 120 app.main:app
```

## Database migrations

Run once per schema change, from a machine with network access to the database:

```
cd backend && DATABASE_URL=... JWT_SECRET=... alembic upgrade head
```

## Deploy

Push to `main` (or run the workflow manually). Verify:

```
curl https://<host>/api/v1/health      # {"status":"ok",...}
curl -I https://<host>/                # 200 text/html
curl -I https://<host>/admin/login     # 200 text/html
```
