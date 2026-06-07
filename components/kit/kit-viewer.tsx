"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Printer, Copy } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { PrintableResume } from "@/components/kit/printable-resume";
import { ResumeRenderer } from "@/components/kit/resume-renderer";
import { generateResumeDocx } from "@/lib/export/generate-docx";
import type { QuestionResponse } from "@/lib/schemas/kit";
import type { ApplicationKitRecord } from "@/lib/types";

export function KitViewer({ id }: { id: string }) {
  const [kit, setKit] = useState<ApplicationKitRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const print = useReactToPrint({ contentRef: printRef });

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/applications/${id}`);
      if (!response.ok) {
        setMessage("Unable to load this kit.");
        setLoading(false);
        return;
      }
      const body = await response.json();
      setKit(body.kit);
      setLoading(false);
    }
    load();
  }, [id]);

  async function saveSection(section: string, content: unknown) {
    const response = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, content })
    });
    if (response.ok) {
      const body = await response.json();
      setKit(body.kit);
      setMessage("Saved.");
    } else {
      setMessage("Unable to save edit.");
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setMessage("Copied to clipboard.");
  }

  async function downloadDocx() {
    if (!kit) return;
    const blob = await generateResumeDocx(kit);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "appcraft-resume.docx";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="text-muted-foreground">Loading kit...</p>;
  if (!kit) return <p className="text-muted-foreground">{message ?? "Kit not found."}</p>;

  const resume = kit.tailored_resume;
  const coverLetter = kit.cover_letter ?? "";
  const questions = kit.question_responses ?? [];
  const notes = kit.application_notes;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {kit.application_input?.job_title ?? "Application kit"}
            </h1>
            <p className="text-muted-foreground">
              {kit.application_input?.company_name ?? "Unknown company"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => resume && copyText(resumeToText(resume))}>
              <Copy className="mr-2 h-4 w-4" />
              Copy resume
            </Button>
            <Button variant="outline" onClick={() => print()}>
              <Printer className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={downloadDocx}>
              <Download className="mr-2 h-4 w-4" />
              DOCX
            </Button>
          </div>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

        <Tabs defaultValue="resume">
          <TabsList>
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="cover">Cover Letter</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="resume">
            {resume ? <ResumeRenderer resume={resume} /> : <EmptyState label="No resume generated." />}
          </TabsContent>

          <TabsContent value="cover">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Cover letter</CardTitle>
                <Button variant="outline" onClick={() => copyText(coverLetter)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[420px] rounded-lg border bg-white p-5 leading-7 outline-none focus:ring-2 focus:ring-ring"
                  onBlur={(event) => saveSection("cover_letter", event.currentTarget.innerText)}
                >
                  {coverLetter}
                </div>
                <p
                  className={
                    wordCount(coverLetter) > 320 ? "text-sm text-red-600" : "text-sm text-muted-foreground"
                  }
                >
                  {wordCount(coverLetter)} words {wordCount(coverLetter) > 320 ? "(over 320)" : ""}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle>Application questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {questions.map((item, index) => (
                    <AccordionItem key={`${item.question}-${index}`} value={`question-${index}`}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent>
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          className="min-h-[140px] rounded-lg border bg-white p-4 leading-7 outline-none focus:ring-2 focus:ring-ring"
                          dangerouslySetInnerHTML={{
                            __html: highlightPlaceholders(item.response)
                          }}
                          onBlur={(event) => {
                            const next = [...questions];
                            next[index] = {
                              ...next[index],
                              response: event.currentTarget.innerText
                            };
                            void saveSection("questions", next);
                          }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            {notes ? (
              <Card>
                <CardHeader>
                  <CardTitle>Application notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>ATS coverage</span>
                      <span>{notes.ats_coverage}%</span>
                    </div>
                    <Progress value={notes.ats_coverage} />
                  </div>
                  <NoteList title="Missing info" items={notes.missing_info} />
                  <NoteList title="Weak sections" items={notes.weak_sections} />
                  <NoteList title="Suggested followups" items={notes.suggested_followups} />
                </CardContent>
              </Card>
            ) : (
              <EmptyState label="No notes generated." />
            )}
          </TabsContent>
        </Tabs>

        <div className="hidden">
          <div ref={printRef}>{resume ? <PrintableResume resume={resume} /> : null}</div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="hidden">placeholder</span>
          </TooltipTrigger>
          <TooltipContent>Add your own detail here</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        {label}
      </CardContent>
    </Card>
  );
}

function NoteList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="mb-2 font-semibold">{title}</h3>
      {items.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">None.</p>
      )}
    </section>
  );
}

function resumeToText(resume: NonNullable<ApplicationKitRecord["tailored_resume"]>) {
  return [
    resume.headline,
    resume.summary,
    resume.skills.length ? `Skills: ${resume.skills.join(", ")}` : "",
    ...resume.experiences.flatMap((experience) => [
      `${experience.title}, ${experience.company}`,
      ...experience.bullets.map((bullet) => `- ${bullet.text}`)
    ])
  ]
    .filter(Boolean)
    .join("\n");
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function highlightPlaceholders(value: string) {
  return escapeHtml(value).replace(
    /\[NOTE:[^\]]+\]/g,
    (match) =>
      `<span class="rounded bg-yellow-200 px-1" title="Add your own detail here">${match}</span>`
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
