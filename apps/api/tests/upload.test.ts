import { describe, expect, it, vi } from "vitest";
import { uploadBuffer } from "../src/lib/cloudinary";
import { PDF_BYTES, PNG_BYTES, adminCookie, api } from "./helpers";

const uploaded = {
  url: "https://res.cloudinary.com/test/image/upload/f_auto,q_auto/a.png",
  publicId: "portfolio/avatar/a",
  width: 1,
  height: 1,
};

const post = (file: Buffer | null, name: string, folder: string, auth = true) => {
  const req = api().post("/api/v1/admin/upload");
  if (auth) req.set("Cookie", adminCookie());
  req.field("folder", folder);
  if (file) req.attach("file", file, name);
  return req;
};

describe("POST /admin/upload", () => {
  it("requires authentication", async () => {
    expect((await post(PNG_BYTES, "a.png", "avatar", false)).status).toBe(401);
    expect(uploadBuffer).not.toHaveBeenCalled();
  });

  it("accepts a real PNG and returns url, publicId and size", async () => {
    vi.mocked(uploadBuffer).mockResolvedValue(uploaded);
    const res = await post(PNG_BYTES, "a.png", "avatar");
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(uploaded);
    expect(uploadBuffer).toHaveBeenCalledWith(expect.any(Buffer), "avatar", "image");
  });

  it("rejects a missing file", async () => {
    const res = await post(null, "", "avatar");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("UPLOAD_INVALID");
  });

  it("rejects a non-image disguised with an image extension (magic bytes)", async () => {
    const res = await post(Buffer.from("<?php echo 1; ?>"), "evil.png", "projects");
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UPLOAD_INVALID");
    expect(uploadBuffer).not.toHaveBeenCalled();
  });

  it("rejects SVG", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>1</script></svg>');
    expect((await post(svg, "x.svg", "projects")).status).toBe(415);
  });

  it("rejects a PDF outside the resume folder, and an image as a resume", async () => {
    expect((await post(PDF_BYTES, "cv.pdf", "avatar")).status).toBe(415);
    expect((await post(PNG_BYTES, "cv.png", "resume")).status).toBe(415);
  });

  it("accepts a PDF for the resume folder", async () => {
    vi.mocked(uploadBuffer).mockResolvedValue({ ...uploaded, publicId: "portfolio/resume/x.pdf" });
    const res = await post(PDF_BYTES, "cv.pdf", "resume");
    expect(res.status).toBe(201);
    expect(uploadBuffer).toHaveBeenCalledWith(expect.any(Buffer), "resume", "pdf");
  });

  it("rejects images over 5 MB", async () => {
    const big = Buffer.concat([PNG_BYTES, Buffer.alloc(5 * 1024 * 1024 + 1)]);
    const res = await post(big, "big.png", "projects");
    expect(res.status).toBe(413);
    expect(uploadBuffer).not.toHaveBeenCalled();
  });

  it("rejects an unknown folder", async () => {
    expect((await post(PNG_BYTES, "a.png", "../etc")).status).toBe(400);
  });
});
