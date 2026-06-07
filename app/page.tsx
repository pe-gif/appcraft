import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 rounded-full border bg-white px-4 py-1 text-sm font-medium text-blue-700">
          AppCraft
        </p>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Turn a job posting into a focused application kit.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          Maintain one rich profile, paste a role, and generate a tailored
          resume, cover letter, question responses, and application notes.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/applications/new"
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Generate application
          </Link>
          <Link
            href="/profile"
            className="rounded-lg border bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
          >
            Build profile
          </Link>
        </div>
      </section>
    </main>
  );
}
