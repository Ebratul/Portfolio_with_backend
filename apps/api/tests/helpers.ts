import request from "supertest";
import { createApp } from "../src/app";
import { signAccessToken } from "../src/lib/jwt";

export const api = (): ReturnType<typeof request> => request(createApp());
export const adminCookie = (): string => `access_token=${signAccessToken("user_1")}`;
export const ORIGIN = "http://localhost:3000";

/** 1x1 transparent PNG. */
export const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);
export const PDF_BYTES = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
