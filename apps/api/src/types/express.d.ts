import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    /** Set by requireAdmin after the access token is verified. */
    auth?: { userId: string };
  }
}
