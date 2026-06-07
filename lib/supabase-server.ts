import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FullUserProfile, SaveProfileInput } from "@/lib/schemas/profile";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function assertSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
}

export function createSupabaseServerClient() {
  assertSupabaseEnv();
  const cookieStore = cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server components cannot mutate cookies; route handlers can.
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server components cannot mutate cookies; route handlers can.
        }
      }
    }
  });
}

export async function requireUser(supabase: SupabaseClient<any>, expectedUserId?: string) {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("You must be signed in.", 401);
  }

  if (expectedUserId && user.id !== expectedUserId) {
    throw new AuthError("You cannot access another user's data.", 403);
  }

  return user;
}

export class AuthError extends Error {
  constructor(message: string, public status = 401) {
    super(message);
  }
}

export async function loadFullUserProfile(
  supabase: SupabaseClient<any>,
  userId: string
): Promise<FullUserProfile> {
  const db = supabase as any;
  const [
    userResult,
    careerResult,
    workResult,
    projectResult,
    skillResult,
    educationResult,
    storyResult,
    essayResult
  ] = await Promise.all([
    db.from("users").select("*").eq("id", userId).single(),
    db.from("career_profiles").select("*").eq("user_id", userId).maybeSingle(),
    db
      .from("work_experiences")
      .select("*")
      .eq("user_id", userId)
      .order("display_order", { ascending: true }),
    db.from("projects").select("*").eq("user_id", userId).order("created_at"),
    db.from("skills").select("*").eq("user_id", userId).order("category"),
    db.from("education").select("*").eq("user_id", userId).order("graduation_year"),
    db.from("behavioral_stories").select("*").eq("user_id", userId).order("title"),
    db.from("essays").select("*").eq("user_id", userId).order("created_at")
  ]);

  if (userResult.error) {
    throw userResult.error;
  }

  return {
    user: {
      id: userResult.data.id,
      email: userResult.data.email,
      name: userResult.data.name
    },
    career_profile: {
      goals: careerResult.data?.goals ?? null,
      interests: careerResult.data?.interests ?? null,
      extracurriculars: careerResult.data?.extracurriculars ?? null,
      writing_style_notes: careerResult.data?.writing_style_notes ?? null,
      target_roles: careerResult.data?.target_roles ?? [],
      target_industries: careerResult.data?.target_industries ?? []
    },
    work_experiences: (workResult.data ?? []) as FullUserProfile["work_experiences"],
    projects: (projectResult.data ?? []) as FullUserProfile["projects"],
    skills: (skillResult.data ?? []) as FullUserProfile["skills"],
    education: (educationResult.data ?? []) as FullUserProfile["education"],
    behavioral_stories: (storyResult.data ?? []) as FullUserProfile["behavioral_stories"],
    essays: (essayResult.data ?? []) as FullUserProfile["essays"]
  };
}

export async function saveFullUserProfile(
  supabase: SupabaseClient<any>,
  userId: string,
  profile: SaveProfileInput
) {
  const db = supabase as any;
  const { error: careerError } = await db.from("career_profiles").upsert({
    user_id: userId,
    ...profile.career_profile,
    updated_at: new Date().toISOString()
  });
  if (careerError) throw careerError;

  await replaceUserRows(db, "work_experiences", userId, profile.work_experiences);
  await replaceUserRows(db, "projects", userId, profile.projects);
  await replaceUserRows(db, "skills", userId, profile.skills);
  await replaceUserRows(db, "education", userId, profile.education);
  await replaceUserRows(db, "behavioral_stories", userId, profile.behavioral_stories);
  await replaceUserRows(db, "essays", userId, profile.essays);
}

async function replaceUserRows(
  supabase: SupabaseClient<any>,
  table:
    | "work_experiences"
    | "projects"
    | "skills"
    | "education"
    | "behavioral_stories"
    | "essays",
  userId: string,
  rows: Array<Record<string, unknown>>
) {
  const { error: deleteError } = await supabase.from(table).delete().eq("user_id", userId);
  if (deleteError) throw deleteError;

  if (!rows.length) return;

  const rowsWithUser = rows.map(({ id: _id, ...row }) => ({
    ...row,
    user_id: userId
  }));
  const { error: insertError } = await supabase.from(table).insert(rowsWithUser);
  if (insertError) throw insertError;
}
