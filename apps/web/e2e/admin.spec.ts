import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@example.com";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe-12345";
const FIXTURE = path.join(__dirname, "fixtures", "test.png");
const RUN = Date.now().toString(36);

/** Cloudinary is not available in CI/local runs, so uploads are answered with a placeholder asset. */
async function stubUploads(page: Page): Promise<void> {
  let n = 0;
  await page.route("**/api/v1/admin/upload", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { url: `https://placehold.co/1280x720/111827/FF4D6D/png?text=E2E-${RUN}-${++n}`, publicId: `seed/e2e-${RUN}-${n}`, width: 1280, height: 720 },
      }),
    }),
  );
}

async function login(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

test.describe("admin auth", () => {
  test("redirects anonymous visitors to the login page", async ({ page }) => {
    await page.goto("/admin/projects");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fprojects/);
  });

  test("shows an error for wrong credentials and validation messages", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email").first()).toBeVisible();
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Invalid email or password" })).toBeVisible();
  });

  test("logs in, returns to the requested page, refreshes an expired access token, and logs out", async ({ page, context }) => {
    await page.goto("/admin/skills");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/skills$/);
    await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();

    // Simulate the 15-minute access token expiring: only the refresh cookie remains.
    const cookies = await context.cookies();
    await context.clearCookies({ name: "access_token" });
    expect(cookies.some((c) => c.name === "refresh_token")).toBe(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();
    expect((await context.cookies()).some((c) => c.name === "access_token")).toBe(true);

    // The cookies are httpOnly, so page scripts cannot read them.
    expect(await page.evaluate(() => document.cookie)).not.toContain("token");

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe("admin content management", () => {
  test.beforeEach(async ({ page }) => {
    await stubUploads(page);
    await login(page);
  });

  test("dashboard shows stats and quick actions", async ({ page }) => {
    await expect(page.getByRole("region", { name: "Statistics" }).getByText("Projects")).toBeVisible();
    await expect(page.getByRole("link", { name: "New project" })).toBeVisible();
  });

  test("skills: add with the icon picker, toggle visibility, delete with confirmation", async ({ page }) => {
    await page.goto("/admin/skills");
    const name = `E2E Skill ${RUN}`;
    await page.getByRole("button", { name: "Add skill" }).click();
    await page.locator("#skill-name").fill(name);
    await page.getByRole("button", { name: "Choose icon" }).click();
    await page.getByLabel("Search icons").fill("rocket");
    await page.getByRole("button", { name: "SiRocketdotchat" }).first().click();
    await page.getByRole("button", { name: "Add skill" }).last().click();
    await expect(page.getByText(`${name}`).first()).toBeVisible();

    const row = page.getByRole("listitem").filter({ hasText: name });
    await row.getByRole("switch", { name: `${name} visible` }).click();
    await expect(row.getByRole("switch", { name: `${name} visible` })).toHaveAttribute("aria-checked", "false");

    await row.getByRole("button", { name: `Delete ${name}` }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText(name)).toHaveCount(0);
  });

  test("project: create with cover + gallery, publish, appears on the public homepage, then delete", async ({ page }) => {
    const title = `E2E Project ${RUN}`;
    await page.goto("/admin/projects/new");
    await page.locator("#p-title").fill(title);
    await expect(page.locator("#p-slug")).toHaveValue(`e2e-project-${RUN}`);
    await page.locator("#p-sub").fill("Created by Playwright");
    await page.locator("#p-summary").fill("A project created by the end-to-end test suite.");
    await page.locator('[aria-label="Rich text editor"]').first().click();
    await page.keyboard.type("Rich description body.");
    await page.locator("#p-tech").fill("Playwright");
    await page.keyboard.press("Enter");

    // Cover: pick a file, crop dialog, confirm.
    await page.getByLabel("Cover file").setInputFiles(FIXTURE);
    await expect(page.getByRole("dialog", { name: "Crop image" })).toBeVisible();
    await page.getByRole("button", { name: "Crop & upload" }).click();
    await expect(page.getByText("Image uploaded")).toBeVisible();

    // Gallery: two images at once.
    await page.getByLabel("Add gallery images").setInputFiles([FIXTURE, FIXTURE]);
    await expect(page.getByLabel("Alt text")).toHaveCount(2);

    await page.getByRole("switch", { name: /Published|Draft/ }).click();
    await page.getByRole("switch", { name: /Featured/ }).click();
    await page.getByRole("button", { name: "Create project" }).click();

    await expect(page).toHaveURL(/\/admin\/projects\/[a-z0-9]+$/);
    await expect(page.getByText("Project created")).toBeVisible();
    await expect(page.getByLabel("Alt text")).toHaveCount(2);

    // The API revalidates the public site, so the new project is visible within seconds.
    await expect(async () => {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: title })).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20_000 });

    await page.goto(`/projects/e2e-project-${RUN}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

    // Clean up.
    await page.goto("/admin/projects");
    await page.getByRole("button", { name: `Delete ${title}` }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText(title)).toHaveCount(0);
    await expect(async () => {
      expect((await page.request.get(`/projects/e2e-project-${RUN}`)).status()).toBe(404);
    }).toPass({ timeout: 15_000 });
  });

  test("project form: validation errors and unsaved-changes guard", async ({ page }) => {
    await page.goto("/admin/projects/new");
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.locator("#p-title-err")).toHaveText("Title is required");
    await expect(page.getByText("Upload a cover image").first()).toBeVisible();
    await page.locator("#p-title").fill("Draft that I abandon");
    let dialogSeen = false;
    page.once("dialog", (d) => {
      dialogSeen = true;
      void d.dismiss();
    });
    await page.getByRole("link", { name: "All projects" }).click();
    expect(dialogSeen).toBe(true);
    await expect(page).toHaveURL(/\/admin\/projects\/new/);
  });

  test("sections: hiding a section removes it from the public page and navbar", async ({ page }) => {
    await page.goto("/admin/sections");
    const row = page.getByRole("listitem").filter({ hasText: "activity" });
    await row.getByRole("switch").click();
    await expect(row.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    await expect(async () => {
      await page.goto("/");
      await expect(page.locator("#activity")).toHaveCount(0);
    }).toPass({ timeout: 20_000 });
    await page.goto("/admin/sections");
    await page.getByRole("listitem").filter({ hasText: "activity" }).getByRole("switch").click();
    await expect(async () => {
      await page.goto("/");
      await expect(page.locator("#activity")).toHaveCount(1);
    }).toPass({ timeout: 20_000 });
  });

  test("settings: changing the primary colour re-themes the public site", async ({ page }) => {
    await page.goto("/admin/settings");
    const input = page.locator("#primaryColor");
    const original = await input.inputValue();
    await input.fill("#10B981");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();
    await expect(async () => {
      await page.goto("/");
      const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--primary").trim());
      expect(primary.toUpperCase()).toBe("#10B981");
    }).toPass({ timeout: 20_000 });
    await page.goto("/admin/settings");
    await page.locator("#primaryColor").fill(original);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();
  });

  test("messages: contact form submission shows up unread, can be read and deleted", async ({ page, browser }) => {
    const subject = `E2E subject ${RUN}`;
    const visitor = await browser.newPage();
    await visitor.goto("/#contact");
    await visitor.locator("#c-name").fill("E2E Visitor");
    await visitor.locator("#c-email").fill("visitor@example.com");
    await visitor.locator("#c-subject").fill(subject);
    await visitor.locator("#c-message").fill("Hello from the end-to-end suite, please ignore.");
    await visitor.getByRole("button", { name: "Send Message" }).click();
    await expect(visitor.getByText("Message sent!")).toBeVisible();
    await visitor.close();

    await page.goto("/admin/messages");
    await expect(page.getByText(subject)).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Admin" }).getByLabel(/unread/)).toBeVisible();
    await page.getByRole("button", { name: new RegExp(subject) }).click();
    await expect(page.getByRole("dialog").getByText("Hello from the end-to-end suite")).toBeVisible();
    await expect(page.getByRole("link", { name: "Reply by email" })).toHaveAttribute("href", /mailto:visitor@example.com/);
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(subject)).toHaveCount(0);
  });

  test("admin pages fit phone and tablet screens without horizontal scrolling", async ({ page }) => {
    for (const width of [360, 768]) {
      await page.setViewportSize({ width, height: 900 });
      for (const url of ["/admin", "/admin/projects", "/admin/skills", "/admin/journey", "/admin/messages", "/admin/settings", "/admin/projects/new"]) {
        await page.goto(url);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${url} at ${width}px`).toBeLessThanOrEqual(0);
      }
    }
    // The sidebar becomes a drawer on small screens.
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/admin");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog", { name: "Navigation" }).getByRole("link", { name: "Skills" }).click();
    await expect(page).toHaveURL(/\/admin\/skills$/);
  });

  test("project form: the card preview's Live Preview and GitHub links work and follow the form", async ({ page }) => {
    await page.goto("/admin/projects");
    await page.getByRole("link", { name: "Edit TaskFlow" }).click();
    const preview = page.getByRole("region", { name: "Card preview" });
    const live = preview.getByRole("link", { name: /Live Preview/ });
    await expect(live).toHaveAttribute("href", /^https:\/\/example\.com\/?$/);
    await expect(live).toHaveAttribute("target", "_blank");
    await expect(preview.getByRole("link", { name: /on GitHub/ })).toHaveAttribute("href", /^https:\/\/github\.com\//);

    // Clicking really opens a new tab (the preview is not inert). The destination's own network
    // availability is not part of this test, so only the opened tab is asserted.
    const [popup] = await Promise.all([page.waitForEvent("popup"), live.click()]);
    await popup.close();

    // The preview follows what is typed; an incomplete URL never becomes a broken link.
    await page.locator("#p-live").fill("https://example.org/demo");
    await expect(live).toHaveAttribute("href", "https://example.org/demo");
    await page.locator("#p-live").fill("example");
    await expect(preview.getByRole("link", { name: /Live Preview/ })).toHaveCount(0);
    await expect(preview.getByRole("button", { name: "View Details" })).toBeDisabled();
  });

  test("account: password confirmation is validated", async ({ page }) => {
    await page.goto("/admin/account");
    await page.locator("#currentPassword").fill(PASSWORD);
    await page.locator("#newPassword").fill("Short1");
    await page.locator("#confirm").fill("Different1");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Use at least 10 characters")).toBeVisible();
    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("profile: edit the tagline, see the unsaved indicator, save, and restore", async ({ page }) => {
    await page.goto("/admin/profile");
    const tagline = page.locator("#tagline");
    const original = await tagline.inputValue();
    await tagline.fill(`${original} (e2e)`);
    await expect(page.getByText("You have unsaved changes")).toBeVisible();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Profile saved")).toBeVisible();
    await expect(page.getByText("All changes saved")).toBeVisible();
    await tagline.fill(original);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Profile saved")).toBeVisible();
  });
});
