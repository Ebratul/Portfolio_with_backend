import { afterEach, describe, expect, it, vi } from "vitest";
import type * as MailerModule from "../src/lib/mailer";

// The global setup mocks the mailer for the other suites; here the real module is under test.
const { notifyContact } = await vi.importActual<typeof MailerModule>("../src/lib/mailer");

const note = { to: "owner@test.dev", name: "Jane <b>Doe</b>", email: "jane@example.com", subject: "Hi", message: "Line 1\nLine 2 <script>x</script>" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("notifyContact via the Resend HTTPS API", () => {
  it("posts the message with the reply-to set to the visitor and HTML escaped", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    notifyContact(note);
    await vi.waitFor(() => { expect(fetchMock).toHaveBeenCalledOnce(); });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer re_test_key");
    const sent = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(sent).toMatchObject({ to: ["owner@test.dev"], reply_to: "jane@example.com", subject: "New portfolio message: Hi" });
    expect(sent.html).not.toContain("<script>");
    expect(sent.html).toContain("&lt;script&gt;");
    expect(sent.html).toContain("Line 1<br>Line 2");
  });

  it("never throws when the provider fails (the message is already stored)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("forbidden", { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(() => { notifyContact(note); }).not.toThrow();
    await vi.waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
  });

  it("survives a network failure", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    expect(() => { notifyContact(note); }).not.toThrow();
    await vi.waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
  });
});
