# 002 — Auth, User и CORS

Что добавлено поверх стартового скелета, чтобы фронт `level-up` мог логиниться через бэкенд.

## Модуль `user` (`internal/modules/user`)

CRUD пользователя по паттерну go-first-api (entity / dto / status / repository (+gorm) / service / handler):

| Метод | Путь | Auth | Описание |
|---|---|---|---|
| POST | `/users` | — | регистрация (public) |
| GET | `/users` | Bearer | список (пагинация `?page=&limit=`) |
| GET | `/users/:id` | Bearer | по id |
| PATCH | `/users` | Bearer | обновить себя (id из токена) |
| DELETE | `/users` | Bearer | удалить себя |

- Пароль хэшируется `bcrypt`, в JSON не отдаётся (`json:"-"`).
- **`age` необязателен** (`binding:"omitempty,min=1"`) — форма регистрации на фронте содержит только имя/email/пароль. При отсутствии `age` в БД пишется дефолт `0`.
- Валидация через gin binding: `name` min 2, `email`, `password` min 8.

## Модуль `auth` (`internal/modules/auth`)

JWT-аутентификация с **серверным logout** (denylist):

| Метод | Путь | Auth | Описание |
|---|---|---|---|
| POST | `/auth/login` | — | вход, возвращает `{ accessToken, user }` |
| GET | `/auth/me` | Bearer | текущий пользователь |
| POST | `/auth/logout` | Bearer | отзыв токена (204) |

- Токен: HS256, TTL 24ч, `jti` (uuid) в claims. `JWT_SECRET` обязателен (сервер не стартует без него).
- **Logout**: `jti` пишется в таблицу `revoked_tokens` (миграция `00002`). Middleware при каждом запросе проверяет denylist и отклоняет отозванный токен (`401 token has been revoked`).
- Middleware `internal/infrastructure/middleware/auth.go` кладёт в контекст `shared.ContextUserKey` (user.User), `ContextJTIKey`, `ContextExpiryKey`.

## CORS (`internal/config` + `cmd/server/main.go`)

Браузерный фронт — это cross-origin запросы, поэтому подключён `github.com/gin-contrib/cors`:

- Origins берутся из env `CORS_ORIGINS` (через запятую); дефолт — `http://localhost:5173`, `http://localhost:4173`, `https://artashmardoyan.github.io`.
- Методы `GET,POST,PATCH,DELETE,OPTIONS`, заголовки `Authorization, Content-Type`, `AllowCredentials`, preflight кэш 12ч.
- Подключён первым middleware в `main.go` (до роутов).

## Формат ответов

```
success → { "data": ... }        error → { "error": "..." }
204 (DELETE / logout) — без тела
```

## Проверка

Локально (`docker compose up` или `go run ./cmd/server`) прогнан полный флоу и подтверждён:
регистрация без `age` → 201, login → токен, `/auth/me` → 200, logout → 204,
повторный `/auth/me` тем же токеном → `401 token has been revoked`, CORS-preflight → 204 c `Access-Control-Allow-Origin`.
