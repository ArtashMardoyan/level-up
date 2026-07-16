# Auth — интеграция с бэкендом

Раньше приложение было полностью офлайн, а логин в `AccountMenu` — демо-заглушкой. Теперь вход/регистрация/выход идут через реальный бэкенд (`level-up-backend`, Gin + JWT).

## Что появилось

**API-слой (`src/services/`)**
- `api.js` — обёртка над `fetch`: база из `import.meta.env.VITE_API_URL`, заголовки `Content-Type` + `Authorization: Bearer <token>`, разбор конверта `{data}`/`{error}`, ошибки → `ApiError { status, message }` (сеть → status 0).
- `endpoints.js` — по одной функции на роут бэкенда: `authLogin/authLogout/authMe`, `usersCreate/usersList/usersGet/usersUpdate/usersDelete`. UI использует auth-подмножество; остальные готовы к использованию.
- `authToken.js` — get/set/clear JWT в `localStorage` (ключ `interviewPrepAuthToken`).

**Состояние (`src/auth/` + `src/hooks/useAuth.js`)**
- Паттерн как у `LanguageContext`: `AuthContext` + owner-хук `useAuthState()` (создаётся раз в `App`) + consumer `useAuth()`.
- На старте: если есть токен — сессия восстанавливается через `authMe()` (при 401 токен чистится). `status`: `idle | loading | authed`.
- `login`, `register` (create → авто-login), `logout`.
- **logout оптимистичный**: состояние сбрасывается мгновенно, отзыв токена на сервере (`/auth/logout`) уходит в фон — выход ощущается моментально.

**UI**
- `components/AuthDialog.jsx` — модалка по дизайну из `docs/redesign/handoff`: логотип-градиент, табы **Log in / Sign up**, uppercase-mono лейблы, placeholders, **show/hide пароля**, инлайн-валидация (корректный email, пароль ≥ 8), нижняя ссылка-переключатель. Закрытие по Esc / клику на бэкдроп. Рендерится через **`createPortal` в `document.body`** — иначе `position: fixed` попадает в stacking-context шапки (у неё `backdrop-filter`) и уходит за неё.
- `components/AccountMenu.jsx` — на реальном auth: имя/инициал из аккаунта, «Войти» открывает `AuthDialog`, sign-out зовёт `logout()`.
- Строки — в `src/i18n/strings.js` (партиция `// AuthDialog`, en + ru).

## Конфиг

- `VITE_API_URL` — база бэкенда. `.env` → `http://localhost:3000` (локалка), `.env.prod` → прод App Runner URL. Оба в `.gitignore`.
- Задеплоенный фронт (GitHub Pages) берёт `VITE_API_URL` из `.github/workflows/deploy.yml` (repo variable `VITE_API_URL` с дефолтом на прод-URL).
- Бэкенд должен разрешать origin фронта в CORS (`https://artashmardoyan.github.io` для Pages, `http://localhost:5173` для dev).

## Поведение токена
- JWT в `localStorage`, подставляется как Bearer.
- `logout` → серверный отзыв (denylist) + локальная очистка.
- Вне scope пока: синхронизация прогресса/избранного из `localStorage` в БД (нет эндпоинтов).
