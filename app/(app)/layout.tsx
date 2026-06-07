import Link from "next/link";
import { FileText, Sparkles, UserRound } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/applications" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AppCraft
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/applications"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <FileText className="h-4 w-4" />
              Applications
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <UserRound className="h-4 w-4" />
              Profile
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
