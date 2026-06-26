# GLM V2

Guía personal para adultos sanos que registra actividad y mediciones reales, adapta rutinas mediante reglas explicables, guía sesiones y propone menús generales curados.

## Desarrollo

1. Usa Node.js 22 y ejecuta `npm install`.
2. Copia las variables documentadas en `.env.example` a `.env.local`.
3. Ejecuta en orden `supabase/migrations/202606240001_glm_v2.sql` y `supabase/migrations/202606240002_session_sets.sql` en Supabase SQL Editor.
4. Configura en Supabase Auth `http://localhost:3000/auth/confirm` y la URL equivalente de producción.
5. Inicia con `npm run dev` y valida con `npm run check`.

Para ejecutar las rutas privadas en Playwright, define `E2E_EMAIL` y `E2E_PASSWORD` con una cuenta exclusiva de pruebas, confirmada y con onboarding completo. La matriz cubre iPhone 15 Plus vertical y horizontal, laptop y escritorio.

La migración V2 elimina las tablas GLM anteriores, pero no elimina usuarios de `auth.users`.

## Límites

GLM no diagnostica, trata lesiones, prescribe dietas clínicas ni promete cambios corporales. Ante dolor o señales de alerta, las reglas detienen la recomendación automática.
