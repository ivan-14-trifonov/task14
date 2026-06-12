# Дерево задач

Приватное Next.js-приложение для управления задачами через дерево направлений.

## Стек

- Next.js App Router
- TypeScript
- Tailwind CSS
- NextAuth / Auth.js через Google OAuth
- Vercel Blob private storage
- Zod

## Локальный запуск

```bash
npm install
npm run dev
```

Приложение откроется на:

```txt
http://localhost:3000
```

## Переменные окружения

В Vercel их нужно добавить в **Project → Settings → Environment Variables**.

```txt
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADMIN_EMAILS=
BLOB_READ_WRITE_TOKEN=
BLOB_STORE_ID=
NEXTAUTH_URL=
```

### AUTH_SECRET

Секрет для подписи JWT-сессий NextAuth.

Сгенерировать можно так:

```bash
openssl rand -base64 32
```

Вставить результат в `AUTH_SECRET`.

### GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET

Создаются в Google Cloud Console:

1. Открыть Google Cloud Console.
2. Создать OAuth Client.
3. Тип приложения: **Web application**.
4. Добавить redirect URI:

```txt
https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/callback/google
```

Для локальной разработки можно добавить:

```txt
http://localhost:3000/api/auth/callback/google
```

Если подключён свой домен, добавить также:

```txt
https://YOUR-DOMAIN.com/api/auth/callback/google
```

Redirect URI должен совпадать точно.

### ADMIN_EMAILS

Список Google-аккаунтов, которым разрешён доступ.

Один email:

```txt
ADMIN_EMAILS=you@gmail.com
```

Несколько email:

```txt
ADMIN_EMAILS=you@gmail.com,another@gmail.com
```

Пользователь с другим email увидит страницу “Доступ запрещён”.

### BLOB_STORE_ID / BLOB_READ_WRITE_TOKEN

Нужны для чтения и записи `tasks-data.json` в Vercel Blob.

В Vercel:

1. Открыть проект.
2. Создать или подключить Vercel Blob store.
3. Store должен быть **private**, не public.
4. Подключить store к проекту.

Если Vercel автоматически добавил:

```txt
BLOB_STORE_ID
```

этого обычно достаточно для production и preview на Vercel: Blob SDK использует `BLOB_STORE_ID` вместе с Vercel OIDC-токеном, который доступен в runtime.

Если приложение запускается локально без `vercel dev` или Vercel не выдал OIDC-доступ, добавьте также:

```txt
BLOB_READ_WRITE_TOKEN
```

`BLOB_WEBHOOK_PUBLIC_KEY` может появиться автоматически. Для этого приложения он не используется.

### NEXTAUTH_URL

Production URL приложения.

Для стандартного домена Vercel:

```txt
NEXTAUTH_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
```

Для своего домена:

```txt
NEXTAUTH_URL=https://YOUR-DOMAIN.com
```

## Деплой на Vercel через GitHub

1. Запушить проект в GitHub.
2. В Vercel выбрать **Add New → Project**.
3. Выбрать GitHub-репозиторий.
4. Добавить переменные окружения из раздела выше.
5. Создать или подключить private Vercel Blob store.
6. В Google Cloud Console добавить production redirect URI:

```txt
https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/callback/google
```

7. Запустить deploy.

Если переменные были добавлены уже после первого деплоя, нужно сделать **Redeploy**.

## Хранение данных

Данные хранятся в private Vercel Blob файле:

```txt
tasks-data.json
```

При первой загрузке файл создаётся автоматически.

Перед каждой записью приложение создаёт backup:

```txt
backups/tasks-data-YYYY-MM-DD-HH-mm-ss.json
```

Хранятся последние 20 backup-файлов.

## Проверки

```bash
npm run typecheck
npm run build
```
