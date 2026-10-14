import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-gradient font-heading text-8xl font-extrabold">404</p>
        <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted">The page you are looking for doesn&apos;t exist or was moved.</p>
        <Link href="/" className="bg-brand-gradient mt-8 inline-flex rounded-full px-7 py-3 font-semibold text-on-primary">
          Back to home
        </Link>
      </div>
    </main>
  );
}
