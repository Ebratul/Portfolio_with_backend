import { expect, test } from "@playwright/test";

const SECTIONS = ["hero", "about", "skills", "projects", "journey", "contact", "activity"] as const;

test.describe("public site", () => {
  test("homepage renders every section, the profile and the navbar", async ({ page }) => {
    await page.goto("/");
    for (const id of SECTIONS) await expect(page.locator(`section#${id}`)).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Alex Morgan");
    await expect(page.getByRole("heading", { level: 2, name: "Technical Arsenal" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Featured Projects" })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const label of ["Home", "About", "Skills", "Projects", "Journey", "Contact"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Get In Touch" })).toBeVisible();
    await expect(page.getByText("Available", { exact: true })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("All rights reserved");
  });

  test("typing animation cycles the roles; reduced motion shows the first role statically", async ({ page, browser }) => {
    await page.goto("/");
    await expect(page.locator("#hero .animate-blink").locator("xpath=..")).toHaveText(/\w+/);
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const calm = await ctx.newPage();
    await calm.goto("/");
    await expect(calm.getByText("Full-Stack Developer", { exact: true }).first()).toBeVisible();
    // Content must not be hidden waiting for an animation.
    await expect(calm.locator("section#about h3").first()).toBeVisible();
    expect(await calm.locator(".animate-blink").count()).toBe(0);
    await ctx.close();
  });

  test("navbar scroll-spy follows the page and links jump to sections", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav.getByRole("link", { name: "Skills", exact: true }).click();
    await expect(page).toHaveURL(/#skills$/);
    await expect(nav.getByRole("link", { name: "Skills", exact: true })).toHaveAttribute("aria-current", "true");
    await page.locator("section#journey").scrollIntoViewIfNeeded();
    await expect(nav.getByRole("link", { name: "Journey", exact: true })).toHaveAttribute("aria-current", "true");
  });

  test("skills tabs switch category by click and arrow keys", async ({ page }) => {
    await page.goto("/#skills");
    const tabs = page.getByRole("tablist", { name: "Skill categories" });
    await expect(tabs.getByRole("tab", { selected: true })).toHaveText("LANGUAGES");
    await expect(page.getByRole("heading", { name: "TYPESCRIPT" })).toBeVisible();
    await tabs.getByRole("tab", { name: "FRONTEND" }).click();
    await expect(page.getByRole("heading", { name: "REACT" })).toBeVisible();
    await tabs.getByRole("tab", { selected: true }).press("ArrowRight");
    await expect(tabs.getByRole("tab", { selected: true })).toHaveText("BACKEND");
    await expect(page.getByRole("heading", { name: "NODE.JS" })).toBeVisible();
  });

  test("project card opens an accessible modal with a gallery; Escape closes it; the shareable page works", async ({ page }) => {
    await page.goto("/#projects");
    await page.getByRole("button", { name: "View details of TaskFlow" }).click();
    const dialog = page.getByRole("dialog", { name: "TaskFlow" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("group", { name: "Project screenshots" })).toBeVisible();
    await dialog.getByRole("button", { name: "Next image" }).click();
    await expect(dialog.getByRole("heading", { name: "Key Features" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    // Focus returns to the card that opened the dialog.
    await expect(page.getByRole("button", { name: "View details of TaskFlow" })).toBeFocused();

    await page.getByRole("button", { name: "View details of TaskFlow" }).click();
    await page.getByRole("link", { name: "Open full page" }).click();
    await expect(page).toHaveURL(/\/projects\/taskflow$/);
    await expect(page.getByRole("heading", { level: 1, name: "TaskFlow" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Key Features" })).toBeVisible();
  });

  test("all-projects page filters by technology", async ({ page }) => {
    await page.goto("/projects");
    const filter = page.getByRole("group", { name: "Filter by technology" });
    await filter.getByRole("button", { name: "MongoDB" }).click();
    await expect(page.getByRole("button", { name: "View details of ShopLine" })).toBeVisible();
    await expect(page.getByRole("button", { name: "View details of TaskFlow" })).toHaveCount(0);
    await filter.getByRole("button", { name: "All", exact: true }).click();
    await expect(page.getByRole("button", { name: "View details of TaskFlow" })).toBeVisible();
  });

  test("journey tabs show experience, education and certificates", async ({ page }) => {
    await page.goto("/#journey");
    await expect(page.getByRole("heading", { name: "Full-Stack Developer", level: 3 })).toBeVisible();
    await expect(page.getByText("PRESENT").first()).toBeVisible();
    await page.getByRole("tab", { name: "Education" }).click();
    await expect(page.getByRole("heading", { name: /B\.Sc\./ })).toBeVisible();
    await page.getByRole("tab", { name: "Certificates" }).click();
    await expect(page.getByRole("link", { name: /View Credential/ })).toHaveAttribute("href", /^https?:\/\//);
  });

  test("theme toggle and accent colour persist across reloads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: "Choose accent colour" }).click();
    await page.getByRole("button", { name: "Violet" }).click();
    const primary = () => page.evaluate(() => document.documentElement.style.getPropertyValue("--primary"));
    expect((await primary()).toUpperCase()).toBe("#8B5CF6");
    await page.reload();
    await expect.poll(primary).toMatch(/8b5cf6/i);
  });

  test("mobile navigation opens as a sheet and closes after choosing a link", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Skills" })).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    const sheet = page.getByRole("dialog", { name: "Menu" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("link", { name: "Skills" }).click();
    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(/#skills$/);
  });

  test("contact form validates input and hides its honeypot", async ({ page }) => {
    await page.goto("/#contact");
    await page.getByRole("button", { name: "Send Message" }).click();
    await expect(page.locator("#c-name-err")).not.toBeEmpty();
    await expect(page.locator("#c-email-err")).not.toBeEmpty();
    await expect(page.locator("#c-message-err")).not.toBeEmpty();
    // Honeypot: present in the DOM for bots, but positioned far off-screen and out of the tab order.
    const box = await page.locator("#c-website").boundingBox();
    expect(box?.x ?? 0).toBeLessThan(-1000);
    await expect(page.locator("#c-website")).toHaveAttribute("tabindex", "-1");
    await expect(page.getByRole("button", { name: "Copy email" })).toBeVisible();
  });

  test("layout never overflows horizontally from 360px phones to 4K screens", async ({ page }) => {
    for (const width of [360, 768, 1280, 1920, 3840]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
    }
  });

  test("SEO: metadata, Open Graph, canonical, JSON-LD, robots, sitemap and a real 404", async ({ page, request }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Alex Morgan/);
    await expect(page.locator('head meta[name="description"]')).toHaveAttribute("content", /.{20,}/);
    await expect(page.locator('head meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('head meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent()) ?? "{}") as { "@type": string; name: string };
    expect(ld["@type"]).toBe("Person");
    expect(ld.name).toBe("Alex Morgan");

    expect(await (await request.get("/robots.txt")).text()).toMatch(/Disallow: \/admin[\s\S]*Sitemap:/);
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/projects/taskflow");

    const missing = await request.get("/projects/does-not-exist");
    expect(missing.status()).toBe(404);
    const res = await page.goto("/totally-unknown");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("keyboard: the skip link is the first tab stop and moves focus to the main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
    await page.keyboard.press("Tab");
    // Focus continues inside <main>, not back in the navbar.
    expect(await page.evaluate(() => document.activeElement?.closest("main") !== null)).toBe(true);
  });

  test("security headers are set and the admin area is not indexable", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["referrer-policy"]).toBeTruthy();
    const login = await request.get("/admin/login");
    expect(await login.text()).toMatch(/name="robots" content="noindex/);
  });
});
