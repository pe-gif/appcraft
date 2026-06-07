import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, createSupabaseServerClient, requireUser } from "@/lib/supabase-server";

const parsedResumeSchema = z.object({
  work_experiences: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        description: z.string().optional(),
        bullets: z.array(z.string()).default([]),
        technologies: z.array(z.string()).default([])
      })
    )
    .default([]),
  skills: z.array(z.string()).default([]),
  education: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([])
});

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const formData = await request.formData();
    const userId = String(formData.get("user_id") ?? "");
    const user = await requireUser(supabase, userId);
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF resumes are supported." }, { status: 400 });
    }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file, {
      contentType: "application/pdf",
      upsert: true
    });
    if (uploadError) throw uploadError;

    const parsed = process.env.ANTHROPIC_API_KEY
      ? await parseResumeWithClaude(file)
      : parsedResumeSchema.parse({
          notes: ["Resume uploaded. Configure ANTHROPIC_API_KEY to enable AI PDF parsing."]
        });

    return NextResponse.json({ storage_path: path, parsed_profile: parsed });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Resume parsing failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function parseResumeWithClaude(file: File) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  const buffer = Buffer.from(await file.arrayBuffer());

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-20250514",
    max_tokens: 2000,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: buffer.toString("base64")
            }
          },
          {
            type: "text",
            text: "Extract work experiences, skills, education, and notes from this resume as strict JSON with keys work_experiences, skills, education, notes."
          }
        ]
      }
    ]
  });

  const text = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
  const json = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  return parsedResumeSchema.parse(JSON.parse(json));
}
