import { NextResponse } from "next/server";
import { kitPatchSchema } from "@/lib/schemas/kit";
import { AuthError, createSupabaseServerClient, requireUser } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);
    const kit = await loadOwnedKit(supabase as any, params.id, user.id);
    return NextResponse.json({ kit });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);
    const db = supabase as any;
    await loadOwnedKit(db, params.id, user.id);

    const patch = kitPatchSchema.parse(await request.json());
    const update: Record<string, unknown> = {};

    if (patch.section === "resume") update.tailored_resume = patch.content;
    if (patch.section === "cover_letter") update.cover_letter = patch.content;
    if (patch.section === "questions") update.question_responses = patch.content;
    if (patch.section === "notes") update.application_notes = patch.content;

    if (patch.section === "tracking") {
      const content = patch.content as { status?: string; notes?: string; applied_at?: string | null };
      const { error } = await db.from("application_tracking").upsert({
        kit_id: params.id,
        user_id: user.id,
        status: content.status ?? "draft",
        notes: content.notes ?? null,
        applied_at: content.applied_at ?? null,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    } else {
      const { error } = await db.from("application_kits").update(update).eq("id", params.id);
      if (error) throw error;

      await db.from("kit_edits").insert({
        kit_id: params.id,
        section: patch.section,
        edited_content: JSON.stringify(patch.content)
      });
    }

    const kit = await loadOwnedKit(db, params.id, user.id);
    return NextResponse.json({ kit });
  } catch (error) {
    return handleError(error);
  }
}

async function loadOwnedKit(db: any, id: string, userId: string) {
  const { data: kit, error: kitError } = await db
    .from("application_kits")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (kitError) throw kitError;

  const [{ data: input }, { data: tracking }] = await Promise.all([
    db.from("application_inputs").select("*").eq("id", kit.application_input_id).single(),
    db.from("application_tracking").select("*").eq("kit_id", kit.id).maybeSingle()
  ]);

  return {
    ...kit,
    application_input: input,
    tracking
  };
}

function handleError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Application request failed.";
  return NextResponse.json({ error: message }, { status: 400 });
}
