import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@example.com";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe-12345";

async function audit(page: Page, label: string): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  expect(summary, `axe violations on ${label}`).toEqual([]);
}

// Scroll-reveal animation is disabled for audits: a half-faded element is a transient state, and
// contrast must be judged on the settled page that visitors actually read.
test.use({ reducedMotion: "reduce" });

test.describe("accessibility (axe, WCAG 2.1 AA)", () => {
  for (const theme of ["dark", "light"] as const) {
    test(`homepage in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((t) => { localStorage.setItem("theme", t); }, theme);
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await audit(page, `home (${theme})`);
    });
  }

  test("homepage tabs, project list and project detail", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "FRONTEND" }).click();
    await page.getByRole("tab", { name: "Certificates" }).click();
    // Let the tab cross-fade finish: axe must judge the settled colours, not a half-faded frame.
    await page.waitForTimeout(700);
    await audit(page, "home after switching tabs");
    await page.goto("/projects");
    await audit(page, "/projects");
    await page.goto("/projects/taskflow");
    await audit(page, "/projects/taskflow");
    await page.goto("/nope");
    await audit(page, "404 page");
  });

  test("open project modal and mobile menu", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "View details of TaskFlow" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await audit(page, "project modal");
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 390, height: 800 });
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
    await audit(page, "mobile menu");
  });

  test("admin login and every admin page", async ({ page }) => {
    await page.goto("/admin/login");
    await audit(page, "admin login");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    const pages: [string, string][] = [
      ["/admin", "Dashboard"],
      ["/admin/profile", "Profile"],
      ["/admin/projects", "Projects"],
      ["/admin/projects/new", "New project"],
      ["/admin/skills", "Skills"],
      ["/admin/journey", "Journey"],
      ["/admin/value-cards", "Value cards"],
      ["/admin/socials", "Social links"],
      ["/admin/sections", "Sections"],
      ["/admin/messages", "Messages"],
      ["/admin/settings", "Site settings"],
      ["/admin/account", "Account"],
    ];
    for (const [url, heading] of pages) {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await page.waitForLoadState("networkidle");
      await audit(page, url);
    }
    await page.goto("/admin/skills");
    await page.getByRole("button", { name: "Add skill" }).click();
    await expect(page.getByRole("dialog", { name: "Add skill" })).toBeVisible();
    await audit(page, "skill dialog");
  });
});
