"use client";

/** Last-resort boundary for errors in the root layout; must render its own <html>. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#0A0E1A", color: "#E8EAF0", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", padding: 16 }}>
          <div role="alert">
            <h1>Something went wrong</h1>
            <p style={{ opacity: 0.7 }}>The site is temporarily unavailable.</p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 16, padding: "12px 28px", borderRadius: 999, border: 0, background: "#FF4D6D", color: "#0A0E1A", fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
