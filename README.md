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

Usuario inicial:

- Correo: `admin@sigera.org`
- Contrasena: `Sigera123*`

## Ejecucion con Docker

Requiere Docker Desktop instalado:

```bash
docker compose up --build
```

## Despliegue en Render

El repositorio incluye un [render.yaml](C:\Users\harr_\Documents\Visual Studio Code Projects\SIGERA\render.yaml) para crear:

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

### Archivos subidos por usuarios

El despliegue en Render queda funcional usando un disco persistente montado en `/var/data/media` para conservar imagenes y documentos subidos.

- En el primer despliegue, `python manage.py bootstrap_media` copia las imagenes base del repositorio al disco persistente.
- En los siguientes despliegues, los archivos ya existentes en el disco se conservan.

Si el proyecto crece, aun puede ser buena idea migrar mas adelante a almacenamiento externo como S3, Cloudinary o R2.
