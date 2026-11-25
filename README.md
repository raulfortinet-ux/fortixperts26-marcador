# FortiXperts26 · Marcador PHP2Shell

Marcador interactivo en vivo para el laboratorio PHP2Shell del evento Fortinet XPERTS26.

- **Admin** (`/admin`): da de alta participantes, resetea contraseñas, exporta CSV.
- **Participante** (`/board`): login con alias + contraseña, ve el marcador en vivo y responde las preguntas de la tarea en curso.
- **Marcador público** (`/live`): vista para proyectar en una TV. Podio, tira de 8 tareas por analista, KPIs y ticker de jugadas. No requiere login.

## Stack
Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Credentials) · TailwindCSS.

## Deploy en Vercel + Neon (Postgres gratis)

1. **Crea una base en [Neon](https://neon.tech)** y copia el `DATABASE_URL` (postgresql://…).
2. **Importa este repo en [Vercel](https://vercel.com/new)**.
3. **Variables de entorno** en el proyecto Vercel:
   - `DATABASE_URL` → la de Neon
   - `NEXTAUTH_URL` → `https://<tu-app>.vercel.app`
   - `NEXTAUTH_SECRET` → genera con `openssl rand -base64 32`
   - `ADMIN_ALIAS` (opcional, por defecto `admin`)
   - `ADMIN_PASSWORD` (cambia la de por defecto)
4. **Deploy**. El `build` crea el esquema automáticamente (`prisma db push`).
5. **Siembra la BD** una sola vez, desde tu máquina apuntando al Neon:
   ```bash
   DATABASE_URL="postgresql://…" npm run seed
   ```
   (crea el admin y las 8 tareas con sus 22 preguntas).

Listo: tu marcador queda en `https://<tu-app>.vercel.app/live`.

## Desarrollo local
Con Node 20+:
```bash
npm install
cp .env.example .env
# edita .env con tu DATABASE_URL (Neon o Postgres local)
npx prisma db push
npm run seed
npm run dev
```
