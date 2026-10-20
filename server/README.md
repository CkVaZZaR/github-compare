# Бэкенд «Анализатор GitHub»

FastAPI-прокси к GitHub REST API со входом через GitHub OAuth и кэшем ответов.

Серверного токена нет: вошедший пользователь тратит свой лимит (5000 запросов/ч),
гости делят анонимный лимит IP сервера (60 запросов/ч). Кэш общий для всех —
публичные данные не зависят от токена, поэтому повторные запросы лимит не тратят.

## Запуск

```bash
cp server/.env.example server/.env   # вписать GITHUB_CLIENT_ID/SECRET и SESSION_SECRET
npm run server                        # http://localhost:8000, документация — /docs
npm run dev                           # фронт, /api проксируется на :8000
```

## Настройка OAuth

1. Создать OAuth App: <https://github.com/settings/developers> → **New OAuth App**
   - Homepage URL — `http://localhost:5173`
   - Authorization callback URL — `http://localhost:5173/api/auth/callback`
2. Вписать в `server/.env`:
   - `GITHUB_CLIENT_ID` — публичный идентификатор приложения (виден в адресе при входе);
   - `GITHUB_CLIENT_SECRET` — секрет приложения, только на бэке, в git не коммитить;
   - `SESSION_SECRET` — ключ шифрования cookie сессии, любая длинная случайная строка.

Токен запрашивается без scope'ов — приложение видит только публичные данные.
Он хранится в зашифрованной httpOnly-cookie, серверного хранилища сессий нет.

## Прод

- Отдельное OAuth App с callback `https://<домен>/api/auth/callback`
  (у OAuth App один callback URL, поэтому dev и прод — разные приложения).
  Лучше заводить его в организации, а не на личном аккаунте.
- Фронт и `/api` — на одном домене (reverse proxy), иначе cookie сессии не дойдёт.
- Секреты — в переменных окружения хостинга, `COOKIE_SECURE=true`, только HTTPS.
- `SESSION_SECRET` постоянный и одинаковый на всех инстансах, иначе сессии
  сбрасываются при перезапуске. Смена секрета разлогинивает всех.

## Ручки

| Ручка | Что отдаёт | Кэш |
|---|---|---|
| `GET /api/users/{login}` | профиль (`/users/{login}`) | да |
| `GET /api/users/{login}/repos` | до 100 репозиториев | да |
| `GET /api/rate_limit` | лимит GitHub API | нет |
| `GET /api/health` | статус, включён ли OAuth, последний гостевой лимит | — |
| `GET /api/auth/login?next=/path` | редирект на GitHub для входа | — |
| `GET /api/auth/callback` | завершение входа, ставит cookie сессии | — |
| `POST /api/auth/logout` | выход | — |
| `GET /api/auth/me` | `{enabled, user: {login, avatar_url} \| null}` | — |

Ошибки: `401 unauthorized` — пользователь отозвал доступ (сессия сбрасывается), `404 not_found`, `429 rate_limit` (+ `reset`, unix-время), `502` — GitHub недоступен, `422` — некорректный логин.
