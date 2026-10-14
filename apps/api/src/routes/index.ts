import { Router, type RequestHandler } from "express";
import multer from "multer";
import { UPLOAD_LIMITS } from "@portfolio/shared";
import { authController } from "../controllers/auth.controller";
import {
  profileController,
  sectionsController,
  settingsController,
  skillsController,
  socialsController,
  timelineController,
  valueCardsController,
} from "../controllers/content.controller";
import {
  messagesController,
  publicController,
  statsController,
  uploadController,
} from "../controllers/misc.controller";
import { projectsController } from "../controllers/projects.controller";
import { requireAdmin } from "../middleware/auth";
import { adminLimiter, contactLimiter, loginLimiter } from "../middleware/rateLimit";

/** Registers list/create/update/remove/reorder; `/reorder` is declared before `/:id`. */
function crud(
  router: Router,
  path: string,
  c: {
    list: RequestHandler;
    create?: RequestHandler;
    update: RequestHandler;
    remove?: RequestHandler;
    reorder: RequestHandler;
  },
): void {
  router.get(path, c.list);
  if (c.create) router.post(path, c.create);
  router.patch(`${path}/reorder`, c.reorder);
  router.patch(`${path}/:id`, c.update);
  if (c.remove) router.delete(`${path}/:id`, c.remove);
}

function authRoutes(): Router {
  const r = Router();
  r.post("/login", loginLimiter(), authController.login);
  r.post("/refresh", authController.refresh);
  r.post("/logout", authController.logout);
  r.get("/me", requireAdmin, authController.me);
  r.patch("/password", requireAdmin, authController.changePassword);
  return r;
}

function publicRoutes(): Router {
  const r = Router();
  r.get("/home", publicController.home);
  r.get("/projects", projectsController.listPublished);
  r.get("/projects/:slug", projectsController.getPublished);
  r.get("/github-activity", publicController.github);
  r.post("/contact", contactLimiter(), publicController.contact);
  return r;
}

function adminRoutes(): Router {
  const r = Router();
  r.use(adminLimiter(), requireAdmin);

  r.get("/stats", statsController.get);
  r.get("/profile", profileController.get);
  r.put("/profile", profileController.update);
  r.get("/settings", settingsController.get);
  r.put("/settings", settingsController.update);

  crud(r, "/skills", skillsController);
  crud(r, "/timeline", timelineController);
  crud(r, "/socials", socialsController);
  crud(r, "/value-cards", valueCardsController);
  r.get("/sections", sectionsController.list);
  r.patch("/sections/reorder", sectionsController.reorder);
  r.patch("/sections/:id", sectionsController.update);

  crud(r, "/projects", { ...projectsController });
  r.get("/projects/:id", projectsController.get);
  r.post("/projects/:id/images", projectsController.addImage);
  r.patch("/projects/:id/images/reorder", projectsController.reorderImages);
  r.patch("/projects/:id/images/:imageId", projectsController.updateImage);
  r.delete("/projects/:id/images/:imageId", projectsController.removeImage);

  r.get("/messages", messagesController.list);
  r.post("/messages/bulk", messagesController.bulk);
  r.patch("/messages/:id", messagesController.update);
  r.delete("/messages/:id", messagesController.remove);

  const upload = multer({
    storage: multer.memoryStorage(),
    // Hard ceiling at the PDF limit; the service enforces the stricter image limit.
    limits: { fileSize: UPLOAD_LIMITS.pdfMaxBytes, files: 1 },
  });
  r.post("/upload", upload.single("file"), uploadController.upload);
  return r;
}

export function apiRoutes(): Router {
  const r = Router();
  r.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });
  r.use("/auth", authRoutes());
  r.use("/public", publicRoutes());
  r.use("/admin", adminRoutes());
  return r;
}
