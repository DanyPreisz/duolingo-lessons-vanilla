# Duolingo lecciones · Vanilla JS

Lecciones de traducción con XP. Node `http` (sin Express) y front vanilla. Listo para **Cloud Run**.

## Local

```bash
npm start
```

http://localhost:8080

- `GET /api/lessons`
- `GET /api/lessons/:id`
- `POST /api/complete` `{ id }`
- `GET /health`

## Persistencia en Cloud Run

El XP se guarda en `/tmp/duolingo-db.json` (y en memoria). Si la instancia se apaga, vuelve al seed.

## Cloud Run

```bash
gcloud auth login
gcloud config set project TU_PROJECT_ID
gcloud run deploy duolingo-lessons \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated
```

## Repo

https://github.com/DanyPreisz/duolingo-lessons-vanilla
