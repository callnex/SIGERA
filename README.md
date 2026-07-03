# SIGERA

Aplicacion web para administracion de refugios de animales domesticos y procesos de adopcion.

## Stack

- Backend: Django, Django REST Framework, JWT, SQLite.
- Frontend: React, Vite, CSS propio, Bootstrap Icons, Recharts.
- Documentacion API: Swagger/OpenAPI en `/api/docs/`.
- Contenedores: Docker Compose preparado.
- Produccion: Render + PostgreSQL.

## Ejecucion local sin Docker

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Swagger: http://localhost:8000/api/docs/


## Ejecucion con Docker

Requiere Docker Desktop instalado:

```bash
docker compose up --build
```

## Despliegue en Render

- El repositorio incluye [render.yaml](C:\Users\harr_\Documents\Visual Studio Code Projects\SIGERA\render.yaml) para crear la infraestructura en Render.
- `sigera-backend` como Web Service de Django.
- `sigera-frontend` como Static Site de Vite.
- `sigera-db` como base de datos PostgreSQL administrada por Render.

La aplicacion ahora usa:

- SQLite en desarrollo local si `DATABASE_URL` no esta definida.
- PostgreSQL en produccion cuando `DATABASE_URL` existe.

### Variables importantes del backend

- `SECRET_KEY`
- `DEBUG`
- `DATABASE_URL`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`

### Migrar datos desde SQLite a PostgreSQL

Antes del primer despliegue productivo, exporta tus datos locales:

```bash
cd backend
python manage.py dumpdata --exclude auth.permission --exclude contenttypes > data.json
```

Despues de crear la base PostgreSQL y configurar `DATABASE_URL`:

```bash
cd backend
python manage.py migrate
python manage.py loaddata data.json
```

### Despliegue demo gratuito

El `render.yaml` actual esta ajustado para una demo gratuita:

- `sigera-backend` usa plan `free`.
- `sigera-db` usa Postgres `free`.
- `sigera-frontend` sigue como Static Site gratuito.

### Archivos subidos por usuarios

En esta variante gratuita, `media/` no usa disco persistente. Eso significa:

- Las imagenes base del repositorio se cargan con `python manage.py bootstrap_media` en el despliegue inicial.
- Los archivos subidos o generados durante la demo pueden perderse si Render reinicia o vuelve a desplegar el servicio.

Si luego quieres una version mas estable, conviene volver a un disco persistente o migrar a almacenamiento externo como S3, Cloudinary o R2.
