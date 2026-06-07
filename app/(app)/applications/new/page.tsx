"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { ApplicationNotes, QuestionResponse, TailoredResume } from "@/lib/schemas/kit";

const steps = [
  "Reading job posting...",
  "Tailoring your resume...",
  "Writing cover letter...",
  "Answering questions..."
];

export default function NewApplicationPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [applicationQuestions, setApplicationQuestions] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [kitId, setKitId] = useState<string | null>(null);
  const [resume, setResume] = useState<TailoredResume | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[] | null>(null);
  const [notes, setNotes] = useState<ApplicationNotes | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);
      } catch {
        setUserId(null);
      }
    }
    loadUser();
  }, []);

  const words = useMemo(
    () => jobDescription.trim().split(/\s+/).filter(Boolean).length,
    [jobDescription]
  );

  async function generate() {
    if (!userId) {
      setError("Sign in before generating an application kit.");
      return;
    }

    setGenerating(true);
    setError(null);
    setKitId(null);
    setResume(null);
    setCoverLetter(null);
    setQuestions(null);
    setNotes(null);
    setActiveStep(0);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        job_description: jobDescription,
        company_description: companyDescription || undefined,
        application_questions: applicationQuestions || undefined,
        user_notes: userNotes || undefined
      })
    });

    if (!response.ok || !response.body) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Generation failed.");
      setGenerating(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const line = event.split("\n").find((item) => item.startsWith("data: "));
        if (!line) continue;
        const payload = JSON.parse(line.slice(6));

        if (payload.error) {
          setError(payload.error);
          setGenerating(false);
        }
        if (payload.section === "resume") {
          setResume(payload.content);
          setActiveStep(1);
        }
        if (payload.section === "cover_letter") {
          setCoverLetter(payload.content);
          setActiveStep(2);
        }
        if (payload.section === "questions") {
          setQuestions(payload.content);
          setActiveStep(3);
        }
        if (payload.section === "notes") {
          setNotes(payload.content);
        }
        if (payload.done) {
          setKitId(payload.kit_id);
          setGenerating(false);
        }
      }
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate application kit</h1>
          <p className="text-muted-foreground">
            Paste a job posting and AppCraft will build tailored materials from your profile.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Job posting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Job description</Label>
              <Textarea
                className="min-h-[320px]"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Example: We are hiring a product-minded software engineer to build customer-facing tools. Responsibilities include..."
              />
              <p className={words > 80 ? "text-sm text-green-700" : "text-sm text-muted-foreground"}>
                {words} words. Minimum 80 words required.
              </p>
            </div>

            <details className="rounded-lg border p-4">
              <summary className="cursor-pointer font-medium">Company description</summary>
              <Textarea
                className="mt-3"
                value={companyDescription}
                onChange={(event) => setCompanyDescription(event.target.value)}
              />
            </details>
            <details className="rounded-lg border p-4">
              <summary className="cursor-pointer font-medium">Application questions</summary>
              <Textarea
                className="mt-3"
                value={applicationQuestions}
                onChange={(event) => setApplicationQuestions(event.target.value)}
                placeholder="Paste short-answer prompts, one per line."
              />
            </details>
            <details className="rounded-lg border p-4">
              <summary className="cursor-pointer font-medium">Notes</summary>
              <Textarea
                className="mt-3"
                value={userNotes}
                onChange={(event) => setUserNotes(event.target.value)}
                placeholder="Anything the AI should emphasize or avoid."
              />
            </details>

            {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <Button onClick={generate} disabled={generating || words <= 80} className="w-full">
              {generating ? "Generating..." : "Generate Application"}
            </Button>
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`rounded-md border p-3 text-sm ${
                  index <= activeStep && generating ? "border-blue-300 bg-blue-50" : "bg-white"
                }`}
              >
                {step}
              </div>
            ))}
            {kitId ? (
              <Button asChild className="w-full">
                <Link href={`/applications/${kitId}`}>Open completed kit</Link>
              </Button>
            ) : null}
            {kitId ? (
              <Button variant="outline" className="w-full" onClick={() => router.push("/applications")}>
                Back to applications
              </Button>
            ) : null}
          </CardContent>
        </Card>
        {resume ? <Preview title="Resume" content={resume.summary ?? resume.headline ?? "Resume ready."} /> : null}
        {coverLetter ? <Preview title="Cover letter" content={coverLetter.slice(0, 220)} /> : null}
        {questions ? <Preview title="Questions" content={`${questions.length} answers generated.`} /> : null}
        {notes ? <Preview title="Notes" content={`${notes.ats_coverage}% ATS coverage estimate.`} /> : null}
      </aside>
    </div>
  );
}

function Preview({ title, content }: { title: string; content: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{content}</p>
      </CardContent>
    </Card>
  );
}
