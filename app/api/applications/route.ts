import { NextResponse } from "next/server";
import { AuthError, createSupabaseServerClient, requireUser } from "@/lib/supabase-server";
import type { ApplicationListItem } from "@/lib/types";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);
    const db = supabase as any;

    const { data: kits, error: kitError } = await db
      .from("application_kits")
      .select("id, application_input_id, created_at, generation_status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (kitError) throw kitError;

    const inputIds = (kits ?? []).map((kit: any) => kit.application_input_id);
    const kitIds = (kits ?? []).map((kit: any) => kit.id);

    const [{ data: inputs }, { data: tracking }] = await Promise.all([
      inputIds.length
        ? db.from("application_inputs").select("id, job_title, company_name").in("id", inputIds)
        : Promise.resolve({ data: [] }),
      kitIds.length
        ? db.from("application_tracking").select("kit_id, status").in("kit_id", kitIds)
        : Promise.resolve({ data: [] })
    ]);

    const inputsById = new Map<string, any>((inputs ?? []).map((input: any) => [input.id, input]));
    const trackingByKitId = new Map<string, any>(
      (tracking ?? []).map((item: any) => [item.kit_id, item])
    );

    const items: ApplicationListItem[] = (kits ?? []).map((kit: any) => {
      const input = inputsById.get(kit.application_input_id);
      return {
        id: kit.id,
        application_input_id: kit.application_input_id,
        company_name: input?.company_name ?? null,
        job_title: input?.job_title ?? null,
        status: trackingByKitId.get(kit.id)?.status ?? "draft",
        created_at: kit.created_at,
        generation_status: kit.generation_status
      };
    });

    return NextResponse.json({ applications: items });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unable to load applications.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
