import { expect, test } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe('authenticated application', () => {
  test.skip(!email || !password, 'Define E2E_EMAIL y E2E_PASSWORD con una cuenta de prueba que ya completó onboarding.');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo').fill(email!);
    await page.getByLabel('Contraseña').fill(password!);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/hoy/);
  });

  test('all modules and URL tabs are reachable', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'laptop', 'La auditoría exhaustiva se ejecuta una vez; la matriz completa cubre el shell responsive.');
    const routes = [
      '/hoy',
      '/plan?tab=semana', '/plan?tab=revision', '/plan?tab=fuentes',
      '/actividad?tab=registrar', '/actividad?tab=historial',
      '/alimentacion?tab=hoy', '/alimentacion?tab=semana', '/alimentacion?tab=comidas', '/alimentacion?tab=compras', '/alimentacion?tab=referencias',
      '/ejercicios', '/ejercicios/chair-squat?tab=tecnica', '/ejercicios/chair-squat?tab=puntos', '/ejercicios/chair-squat?tab=errores',
      '/progreso?tab=resumen', '/progreso?tab=registrar', '/progreso?tab=historial',
      '/ajustes?tab=entrenamiento', '/ajustes?tab=alimentacion', '/ajustes?tab=seguridad',
      '/guia',
    ];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} tiene scroll horizontal`).toBeLessThanOrEqual(1);
    }
  });

  test('responsive shell keeps the correct navigation visible', async ({ page, viewport }) => {
    await page.goto('/hoy');
    const mobile = (viewport?.width ?? 1280) < 1024;
    const navigation = page.getByRole('navigation', { name: 'Navegación principal' });
    if (mobile) await expect(navigation).toBeVisible();
    else await expect(navigation).toBeHidden();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('browser history restores URL-backed tabs', async ({ page }) => {
    await page.goto('/plan?tab=semana');
    await page.getByRole('link', { name: 'Revisión' }).click();
    await expect(page).toHaveURL(/tab=revision/);
    await page.goBack();
    await expect(page).toHaveURL(/tab=semana/);
    await page.goForward();
    await expect(page).toHaveURL(/tab=revision/);
  });
});
