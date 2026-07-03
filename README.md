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



