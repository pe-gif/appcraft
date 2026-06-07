import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user?.email) {
      await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? null
      });
    }
  }

  return NextResponse.redirect(`${origin}/applications`);
}
