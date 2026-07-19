# User Profile — экран профиля + редактирование

Отдельный экран профиля пользователя и модалка редактирования. Дизайн — из
`docs/redesign/handoff/README.md` → «Profile & edit». Реальные данные берутся из
`useAuth().user` и `GET /progress/summary`; часть блоков — помеченные плейсхолдеры (нет
бэкенда). Ради полного редактирования **бэкенд был расширен** (см. ниже).

## Роутинг

- Хеш-роут `#profile` (тот же механизм `useHashRoute`, что и `#course`, `#dictionary`).
- `App.jsx` ветвится: `courseId === 'profile'` → `<ProfilePage>`.
- Навигация: `onViewProfile` прокинут `App → AppHeader → AccountMenu`. В `AccountMenu`
  строка «аватар + имя» кликабельна (шеврон + hover) и зовёт `navigate('profile')` — это
  единственная точка входа в профиль из меню; отдельную кнопку **View profile** под
  статами убрали как дублирующую.

## Экран (`components/ProfilePage.jsx`)

`<main class="profile-page">`, ширина ≤ 900px, `--page-accent: #818cf8`. При монтировании
(если есть `user`) грузит `progressSummary()`. Блоки сверху вниз:

1. **Back home** — кнопка со стрелкой → `onNavigate(null)`.
2. **Identity card** — 88px градиентный аватар (инициал), имя, пилюля трека + email, био,
   кнопка **Edit profile** (справа), мягкое radial-свечение.
3. **Stat row** — 3 карточки: 🔥 серия (**плейсхолдер** `DEMO_STREAK`), просмотрено
   (`totalReviewed`), избранное (`totalFavorites`).
4. **Course progress** + **Recent activity** (2-up сетка `minmax(280px,1fr)`):
   - *Course progress* — **реально**: по каждому курсу `summary.byCourse[course.uuid]`
     (ключ — uuid курса), полоса на `--page-accent` курса. Показываются курсы с
     `reviewed > 0`, отсортированные по убыванию.
   - *Recent activity* — **плейсхолдер** (нет ленты активности), помечен тегом «Preview»,
     привязан к реальным курсам ради правдоподобия.
5. **Saved questions** — **реально**: курсы с `favorites > 0` (счётчики из summary). Список
   отдельных вопросов пока не показываем — `/progress/summary` даёт только количества.
6. **Achievements** — вычисляются из реальных чисел (пороги reviewed/saved/streak).
7. **Danger zone** — **Sign out** (`logout()` + домой) и **Delete account** (за `confirm()` →
   `usersDelete()` → `logout()` → домой).

Состояние «не залогинен»: экран с приглашением войти + Back home. Загрузка: shimmer-скелетоны
(`.skeleton`) для статов и прогресса.

## Модалка (`components/EditProfileDialog.jsx`)

Портал в `document.body` (как `AuthDialog`), `z-index: 130`. Сид формы — при открытии, через
render-time guard `open !== prevOpen` (не `setState` в эффекте — правило линтера репозитория).

- **Поля**: Upload photo (плейсхолдер — скрытый `<input type=file>`, фолбэк на инициал),
  Name, Track (select: Backend/Frontend/Full-stack/DevOps/Mobile), Email, Bio (textarea),
  секция Change password (текущий + новый).
- **Валидация**: имя ≥ 2; корректный email; новый пароль (если введён) ≥ **8** (совпадает с
  бэкендом и `AuthDialog`), при этом текущий пароль обязателен. Ошибки инлайн, `#f87171`.
- **Save** → `usersUpdate({ name, email, track, bio, currentPassword?, newPassword? })`. Пароль
  уходит только если введён новый. Успех → `onSaved(updated)` (это `updateUser` из `useAuth`,
  мержит поля в кэшированного `user`, синхронит шапку и identity-card) → закрытие.
- **Ошибки бэкенда** → инлайн: 401 (неверный текущий пароль), 409 (email занят), 0 (сеть).
- Закрытие: Cancel / ✕ / бэкдроп / Esc.

## Данные и `user`

- Форма `user`: `{ id, name, email, age, bio, track }` (`bio`/`track` добавлены на бэкенде).
- `useAuth` получил `updateUser(next)` — merge полей в кэш после сохранения.
- Строки — `src/i18n/strings.js`, партиции `// ProfilePage` и `// EditProfileDialog`, en + ru.
- Стили — `src/index.css`, блоки `/* Profile page */` и `/* Edit profile dialog */`, оба темы,
  правило `@media (max-width: 560px)`.

## Расширение бэкенда (`level-up-backend`)

Чтобы модалка реально сохраняла все поля:

- `User` получил `bio` + `track` (goose-миграция `migrations/00007_add_bio_track_to_users.sql`,
  применяется на старте контейнера).
- `PATCH /users` (`UpdateDTO`) теперь принимает `email` (`omitempty,email`, проверка уникальности
  против чужих аккаунтов → **409** `ErrEmailTaken`), `bio`, `track`, и смену пароля
  `currentPassword` + `newPassword` (`omitempty,min=8`; текущий сверяется bcrypt-ом, неверный →
  **401** `ErrWrongPassword`). Сущность возвращается напрямую, поэтому `authMe`/`login`/`update`
  теперь отдают `bio` + `track`.
- Тесты сервиса — `internal/modules/user/service_test.go`. Postman — тело `PATCH /users` обновлено.

## Вне scope (плейсхолдеры / бэкенд позже)

- **Серия (streak)** — нет эндпоинта, показываем `DEMO_STREAK`.
- **Recent activity** — нет ленты активности; помечено «Preview».
- **Список избранных вопросов** — summary даёт только количества; для заголовков вопросов нужен
  отдельный запрос (`courseProgress`) с маппингом favorites → questions.
- **Загрузка фото** — UI-плейсхолдер; нужен сторедж на бэкенде.
