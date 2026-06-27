# Despliegue

GLM se despliega como aplicación Next.js en Vercel y como PWA instalable. Producción usa GitHub auto-deploy desde `main`, dominio inicial `https://<vercel-project>.vercel.app` y el proyecto actual de Supabase.

## Supabase

- Ejecutar en orden `202606240001_glm_v2.sql`, `202606240002_session_sets.sql` y `202606260001_photo_meals.sql` en SQL Editor.
- Activar confirmación de correo y SMTP propio.
- Configurar Auth > URL Configuration:
  - Site URL: `https://<vercel-project>.vercel.app`.
  - Redirect URLs: `https://<vercel-project>.vercel.app/auth/confirm` y `http://localhost:3000/auth/confirm`.
  - Para previews con correo, agregar también `https://*.vercel.app/auth/confirm`.
- Confirmar que el bucket privado `meal-photos` existe y que las políticas Storage limitan acceso a rutas `{auth.uid()}/...`.
- No incluir `SUPABASE_SERVICE_ROLE_KEY` en variables públicas ni en código cliente.

## Vercel

- Importar el repositorio desde GitHub y dejar `main` como Production Branch.
- Configurar Node.js `22.x`, Install Command `npm install`, Build Command `npm run build` y Output default de Next.js.
- Crear variables en Production y Preview:
  - `NEXT_PUBLIC_APP_URL=https://<vercel-project>.vercel.app`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL=gpt-5.4-mini`
  - `OPENAI_VISION_MODEL=gpt-5.4-mini`
  - `USDA_API_KEY`
  - `CRON_SECRET`
  - `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`, `USDA_API_KEY`, `CRON_SECRET` y `SUPABASE_SERVICE_ROLE_KEY` son secretos de servidor; nunca deben llevar prefijo `NEXT_PUBLIC_`.
- `vercel.json` registra `/api/cron/purge-coach` a las `03:15 UTC`. Vercel envía `Authorization: Bearer <CRON_SECRET>` automáticamente.
- Después de cambiar variables, redeployar para que el build y las funciones reciban los nuevos valores.

## PWA

- Serwist se activa sólo en build productivo y genera `public/sw.js`.
- El service worker cachea recursos estáticos y `/offline`; las rutas autenticadas, fotos, planes, comidas, estadísticas y conversaciones usan red.
- Verificar después del deploy:
  - `https://<vercel-project>.vercel.app/manifest.webmanifest` responde como `application/manifest+json`.
  - `https://<vercel-project>.vercel.app/sw.js` responde como JavaScript y `Cache-Control: no-cache, no-store, must-revalidate`.
  - En DevTools > Application, el manifest es instalable y el service worker queda activo.
  - En modo offline, sólo aparece `/offline`; no deben aparecer datos personales cacheados.

## OpenAI

- Responses API usa `store: false`, salida JSON estructurada y contexto mínimo.
- Los datos enviados no incluyen nombre, correo ni notas clínicas completas.
- Revisar controles de retención de la organización antes de producción.

## Checklist final

- Local: `npm run check`, `npm run test:e2e` y `npm run check:duplicates`.
- Producción local: `npm run build`, `npm run start` y revisión manual de `/offline`, `/manifest.webmanifest` y `/sw.js`.
- Vercel: revisar logs del build, logs del cron, registro/login, confirmación de correo, onboarding, Guía IA, comidas con foto, estadísticas y navegación en iPhone 15 Plus.
- Git: commitear cambios de configuración/documentación/assets y hacer push a `main` para disparar el deploy.
