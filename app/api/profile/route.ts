import { NextResponse } from "next/server";
import { saveProfileSchema } from "@/lib/schemas/profile";
import {
  AuthError,
  createSupabaseServerClient,
  loadFullUserProfile,
  requireUser,
  saveFullUserProfile
} from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);
    const profile = await loadFullUserProfile(supabase, user.id);
    return NextResponse.json(profile);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const body = await request.json();
    const user = await requireUser(supabase, body.user_id);
    const parsed = saveProfileSchema.parse(body.profile ?? body);
    await saveFullUserProfile(supabase, user.id, parsed);
    const profile = await loadFullUserProfile(supabase, user.id);
    return NextResponse.json(profile);
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Profile request failed.";
  return NextResponse.json({ error: message }, { status: 400 });
}
