import { describe, expect, it } from "vitest";
import { api } from "./helpers";

describe("rate limiting scope", () => {
  it("does not throttle ordinary public reads (the Next server calls the API from one IP)", async () => {
    const agent = api();
    for (let i = 0; i < 350; i++) {
      expect((await agent.get("/api/v1/health")).status).toBe(200);
    }
  });
});
