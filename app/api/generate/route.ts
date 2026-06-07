import { NextResponse } from "next/server";
import { readJobPosting } from "@/lib/agents/reader-agent";
import { tailorApplication } from "@/lib/agents/tailoring-agent";
import { generateRequestSchema } from "@/lib/schemas/kit";
import {
  AuthError,
  createSupabaseServerClient,
  loadFullUserProfile,
  requireUser
} from "@/lib/supabase-server";
import type { GenerationSection } from "@/lib/types";

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const body = generateRequestSchema.parse(await request.json());

    if (wordCount(body.job_description) < 80) {
      return NextResponse.json(
        { error: "Job description must be at least 80 words to generate an application kit." },
        { status: 400 }
      );
    }

    const user = await requireUser(supabase, body.user_id);
    const profile = await loadFullUserProfile(supabase, user.id);
    const db = supabase as any;

    const { data: input, error: inputError } = await db
      .from("application_inputs")
      .insert({
        user_id: user.id,
        job_description: body.job_description,
        company_description: body.company_description ?? null,
        application_questions: body.application_questions ?? null,
        user_notes: body.user_notes ?? null
      })
      .select("*")
      .single();
    if (inputError) throw inputError;

    const jobProfile = await readJobPosting(body);
    await db
      .from("application_inputs")
      .update({
        job_title: jobProfile.job_title,
        company_name: jobProfile.company_name,
        job_profile_json: jobProfile
      })
      .eq("id", input.id);

    const { data: kit, error: kitError } = await db
      .from("application_kits")
      .insert({
        application_input_id: input.id,
        user_id: user.id,
        generation_status: "generating"
      })
      .select("*")
      .single();
    if (kitError) throw kitError;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (payload: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        try {
          send({ step: "Reading job posting...", job_profile: jobProfile });

          for await (const chunk of tailorApplication(jobProfile, profile)) {
            await persistChunk(db, kit.id, chunk);
            send(chunk);
          }

          await db.from("application_kits").update({ generation_status: "complete" }).eq("id", kit.id);
          await db.from("application_tracking").upsert({
            kit_id: kit.id,
            user_id: user.id,
            status: "draft",
            updated_at: new Date().toISOString()
          });
          send({ done: true, kit_id: kit.id });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Generation failed.";
          await db
            .from("application_kits")
            .update({
              generation_status: "failed",
              generation_error: message
            })
            .eq("id", kit.id);
          send({ error: message, kit_id: kit.id });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Generation request failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function persistChunk(db: any, kitId: string, chunk: GenerationSection) {
  const update: Record<string, unknown> = {};
  if (chunk.section === "resume") update.tailored_resume = chunk.content;
  if (chunk.section === "cover_letter") update.cover_letter = chunk.content;
  if (chunk.section === "questions") update.question_responses = chunk.content;
  if (chunk.section === "notes") update.application_notes = chunk.content;

  const { error } = await db
    .from("application_kits")
    .update({ ...update, generation_status: "generating" })
    .eq("id", kitId);
  if (error) throw error;
}
