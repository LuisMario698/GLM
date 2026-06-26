import { expect, test } from '@playwright/test';

test('login communicates the product boundary without horizontal overflow',async({page})=>{await page.goto('/login');await expect(page.getByRole('heading',{name:'Tu guía empieza aquí'})).toBeVisible();await expect(page.getByText(/situación real/i)).toBeVisible();const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);expect(overflow).toBeLessThanOrEqual(1);});
test('offline screen does not expose cached health data',async({page})=>{await page.goto('/offline');await expect(page.getByRole('heading',{name:'Sin conexión'})).toBeVisible();await expect(page.getByText(/nunca se guardan en la caché/i)).toBeVisible();});
