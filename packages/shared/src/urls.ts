import { z } from "zod";

/**
 * A web URL that must use http(s). Zod's plain `.url()` also accepts schemes such as `javascript:`,
 * which must never end up in an `href` rendered on the public site.
 */
export const httpUrl = z
  .string()
  .trim()
  .url("Enter a full URL starting with https://")
  .refine((value) => /^https?:\/\//i.test(value), "Only http:// and https:// links are allowed");
