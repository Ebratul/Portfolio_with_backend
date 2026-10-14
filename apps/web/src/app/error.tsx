"use client";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="grid min-h-screen place-items-center px-4 text-center">
      <div role="alert">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted">The page could not be loaded. Please try again in a moment.</p>
        <button
          type="button"
          onClick={reset}
          className="bg-brand-gradient mt-6 inline-flex rounded-full px-7 py-3 font-semibold text-on-primary"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
