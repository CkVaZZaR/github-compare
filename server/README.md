# Бэкенд «Анализатор GitHub»

FastAPI-прокси к GitHub REST API с серверным токеном и кэшем ответов.

## Запуск

```bash
cp server/.env.example server/.env   # вписать GITHUB_TOKEN
npm run server                        # http://localhost:8000, документация — /docs
npm run dev                           # фронт, /api проксируется на :8000
```

Без токена бэк работает с лимитом 60 запросов/ч, с токеном — 5000/ч.

## Ручки

| Ручка | Что отдаёт | Кэш |
|---|---|---|
| `GET /api/users/{login}` | профиль (`/users/{login}`) | да |
| `GET /api/users/{login}/repos` | до 100 репозиториев | да |
| `GET /api/rate_limit` | лимит GitHub API | нет |
| `GET /api/health` | статус, наличие токена, последний лимит | — |

Ошибки: `404 not_found`, `429 rate_limit` (+ `reset`, unix-время), `502` — GitHub недоступен, `422` — некорректный логин.
