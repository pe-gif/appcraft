"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/profile/tag-input";
import type { FullUserProfile } from "@/lib/schemas/profile";

type DraftProfile = Omit<FullUserProfile, "user">;

const emptyDraft: DraftProfile = {
  career_profile: {
    goals: "",
    interests: "",
    extracurriculars: "",
    writing_style_notes: "",
    target_roles: [],
    target_industries: []
  },
  work_experiences: [],
  projects: [],
  skills: [],
  education: [],
  behavioral_stories: [],
  essays: []
};

export function ProfileEditor() {
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftProfile>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        setMessage("Sign in to edit your profile.");
        setLoading(false);
        return;
      }
      const profile = (await response.json()) as FullUserProfile;
      setUserId(profile.user.id);
      setDraft({
        career_profile: profile.career_profile,
        work_experiences: profile.work_experiences,
        projects: profile.projects,
        skills: profile.skills,
        education: profile.education,
        behavioral_stories: profile.behavioral_stories,
        essays: profile.essays
      });
      setLoading(false);
    }
    load();
  }, []);

  const strength = useMemo(() => calculateStrength(draft), [draft]);

  async function saveProfile() {
    if (!userId) return;
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, profile: draft })
    });
    setSaving(false);
    setMessage(response.ok ? "Saved." : "Unable to save profile.");
  }

  function updateCareer(field: keyof DraftProfile["career_profile"], value: unknown) {
    setDraft((current) => ({
      ...current,
      career_profile: { ...current.career_profile, [field]: value }
    }));
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading profile...</p>;
  }

  return (
    <div className="space-y-6" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        void saveProfile();
      }
    }}>
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Career profile</h1>
          <p className="text-sm text-muted-foreground">
            Keep this profile rich and current so every generated kit can cite real experience.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between text-sm">
            <span>Profile strength</span>
            <span>{strength}%</span>
          </div>
          <Progress value={strength} />
        </div>
        <Button onClick={saveProfile} disabled={saving || !userId}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save all"}
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Goals">
            <Textarea
              value={draft.career_profile.goals ?? ""}
              onChange={(event) => updateCareer("goals", event.target.value)}
            />
          </Field>
          <Field label="Interests">
            <Textarea
              value={draft.career_profile.interests ?? ""}
              onChange={(event) => updateCareer("interests", event.target.value)}
            />
          </Field>
          <Field label="Extracurriculars">
            <Textarea
              value={draft.career_profile.extracurriculars ?? ""}
              onChange={(event) => updateCareer("extracurriculars", event.target.value)}
            />
          </Field>
          <Field label="Writing style notes">
            <Textarea
              value={draft.career_profile.writing_style_notes ?? ""}
              onChange={(event) => updateCareer("writing_style_notes", event.target.value)}
            />
          </Field>
          <Field label="Target roles">
            <TagInput
              value={draft.career_profile.target_roles}
              onChange={(value) => updateCareer("target_roles", value)}
            />
          </Field>
          <Field label="Target industries">
            <TagInput
              value={draft.career_profile.target_industries}
              onChange={(value) => updateCareer("target_industries", value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Section
        title="Work Experience"
        onAdd={() =>
          setDraft((current) => ({
            ...current,
            work_experiences: [
              ...current.work_experiences,
              {
                company: "",
                title: "",
                start_date: "",
                end_date: "",
                is_current: false,
                description: "",
                bullets: [],
                achievements: [],
                technologies: [],
                display_order: current.work_experiences.length
              }
            ]
          }))
        }
      >
        {draft.work_experiences.map((experience, index) => (
          <Card
            key={experience.id ?? index}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex === null || dragIndex === index) return;
              setDraft((current) => {
                const next = [...current.work_experiences];
                const [moved] = next.splice(dragIndex, 1);
                next.splice(index, 0, moved);
                return {
                  ...current,
                  work_experiences: next.map((item, itemIndex) => ({
                    ...item,
                    display_order: itemIndex
                  }))
                };
              });
              setDragIndex(null);
            }}
            className="cursor-move"
          >
            <CardContent className="grid gap-4 p-4 md:grid-cols-2">
              <Field label="Company">
                <Input
                  value={experience.company}
                  onChange={(event) => updateArray("work_experiences", index, "company", event.target.value)}
                />
              </Field>
              <Field label="Title">
                <Input
                  value={experience.title}
                  onChange={(event) => updateArray("work_experiences", index, "title", event.target.value)}
                />
              </Field>
              <Field label="Start date">
                <Input
                  type="date"
                  value={experience.start_date ?? ""}
                  onChange={(event) => updateArray("work_experiences", index, "start_date", event.target.value)}
                />
              </Field>
              <Field label="End date">
                <Input
                  type="date"
                  value={experience.end_date ?? ""}
                  disabled={experience.is_current}
                  onChange={(event) => updateArray("work_experiences", index, "end_date", event.target.value)}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={experience.is_current}
                  onChange={(event) => updateArray("work_experiences", index, "is_current", event.target.checked)}
                />
                Current role
              </label>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea
                    value={experience.description ?? ""}
                    onChange={(event) => updateArray("work_experiences", index, "description", event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Bullets">
                <TagInput
                  value={experience.bullets}
                  onChange={(value) => updateArray("work_experiences", index, "bullets", value)}
                />
              </Field>
              <Field label="Technologies">
                <TagInput
                  value={experience.technologies}
                  onChange={(value) => updateArray("work_experiences", index, "technologies", value)}
                />
              </Field>
              <Button
                variant="destructive"
                type="button"
                onClick={() => removeArrayItem("work_experiences", index)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </Section>

      <SimpleCollection
        title="Projects"
        rows={draft.projects}
        addLabel="Add project"
        onAdd={() => addArrayItem("projects", { name: "", description: "", role: "", tech_stack: [], outcomes: "", url: "", is_featured: false })}
        onRemove={(index) => removeArrayItem("projects", index)}
        render={(project, index) => (
          <>
            <Field label="Name"><Input value={project.name} onChange={(event) => updateArray("projects", index, "name", event.target.value)} /></Field>
            <Field label="Role"><Input value={project.role ?? ""} onChange={(event) => updateArray("projects", index, "role", event.target.value)} /></Field>
            <Field label="Description"><Textarea value={project.description ?? ""} onChange={(event) => updateArray("projects", index, "description", event.target.value)} /></Field>
            <Field label="Tech stack"><TagInput value={project.tech_stack} onChange={(value) => updateArray("projects", index, "tech_stack", value)} /></Field>
          </>
        )}
      />

      <SimpleCollection
        title="Skills"
        rows={draft.skills}
        addLabel="Add skill"
        onAdd={() => addArrayItem("skills", { name: "", category: "", proficiency: "intermediate" })}
        onRemove={(index) => removeArrayItem("skills", index)}
        render={(skill, index) => (
          <>
            <Field label="Skill"><Input value={skill.name} onChange={(event) => updateArray("skills", index, "name", event.target.value)} /></Field>
            <Field label="Category"><Input value={skill.category ?? ""} onChange={(event) => updateArray("skills", index, "category", event.target.value)} /></Field>
            <Field label="Proficiency">
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={skill.proficiency ?? ""} onChange={(event) => updateArray("skills", index, "proficiency", event.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </Field>
          </>
        )}
      />

      <SimpleCollection
        title="Education"
        rows={draft.education}
        addLabel="Add education"
        onAdd={() => addArrayItem("education", { institution: "", degree: "", field: "", graduation_year: null, gpa: "", honors: "", activities: [] })}
        onRemove={(index) => removeArrayItem("education", index)}
        render={(education, index) => (
          <>
            <Field label="Institution"><Input value={education.institution} onChange={(event) => updateArray("education", index, "institution", event.target.value)} /></Field>
            <Field label="Degree"><Input value={education.degree ?? ""} onChange={(event) => updateArray("education", index, "degree", event.target.value)} /></Field>
            <Field label="Field"><Input value={education.field ?? ""} onChange={(event) => updateArray("education", index, "field", event.target.value)} /></Field>
            <Field label="Graduation year"><Input type="number" value={education.graduation_year ?? ""} onChange={(event) => updateArray("education", index, "graduation_year", event.target.value ? Number(event.target.value) : null)} /></Field>
          </>
        )}
      />

      <SimpleCollection
        title="Stories"
        rows={draft.behavioral_stories}
        addLabel="Add story"
        onAdd={() => addArrayItem("behavioral_stories", { title: "", themes: [], situation: "", task: "", action: "", result: "", company_context: "" })}
        onRemove={(index) => removeArrayItem("behavioral_stories", index)}
        render={(story, index) => (
          <>
            <Field label="Title"><Input value={story.title ?? ""} onChange={(event) => updateArray("behavioral_stories", index, "title", event.target.value)} /></Field>
            <Field label="Themes"><TagInput value={story.themes} onChange={(value) => updateArray("behavioral_stories", index, "themes", value)} /></Field>
            <Field label="Situation"><Textarea value={story.situation} onChange={(event) => updateArray("behavioral_stories", index, "situation", event.target.value)} /></Field>
            <Field label="Task"><Textarea value={story.task} onChange={(event) => updateArray("behavioral_stories", index, "task", event.target.value)} /></Field>
            <Field label="Action"><Textarea value={story.action} onChange={(event) => updateArray("behavioral_stories", index, "action", event.target.value)} /></Field>
            <Field label="Result"><Textarea value={story.result} onChange={(event) => updateArray("behavioral_stories", index, "result", event.target.value)} /></Field>
          </>
        )}
      />
    </div>
  );

  function updateArray<K extends keyof DraftProfile>(
    key: K,
    index: number,
    field: string,
    value: unknown
  ) {
    setDraft((current) => {
      const next = [...(current[key] as Array<Record<string, unknown>>)];
      next[index] = { ...next[index], [field]: value };
      return { ...current, [key]: next };
    });
  }

  function addArrayItem<K extends keyof DraftProfile>(key: K, item: unknown) {
    setDraft((current) => ({
      ...current,
      [key]: [...(current[key] as unknown[]), item]
    }));
  }

  function removeArrayItem<K extends keyof DraftProfile>(key: K, index: number) {
    setDraft((current) => ({
      ...current,
      [key]: (current[key] as unknown[]).filter((_, itemIndex) => itemIndex !== index)
    }));
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Section({
  title,
  children,
  onAdd
}: {
  title: string;
  children: ReactNode;
  onAdd: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <Button type="button" onClick={onAdd} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function SimpleCollection<T>({
  title,
  rows,
  addLabel,
  onAdd,
  onRemove,
  render
}: {
  title: string;
  rows: T[];
  addLabel: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  render: (row: T, index: number) => ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <Button type="button" variant="outline" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, index) => (
          <Card key={index}>
            <CardContent className="grid gap-4 p-4 md:grid-cols-2">
              {render(row, index)}
              <Button variant="destructive" type="button" onClick={() => onRemove(index)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

function calculateStrength(profile: DraftProfile) {
  const checks = [
    profile.work_experiences.length >= 2,
    profile.work_experiences.some((item) => item.bullets.length >= 2),
    profile.skills.length >= 5,
    profile.projects.length >= 1,
    profile.education.length >= 1,
    profile.behavioral_stories.length >= 2,
    Boolean(profile.career_profile.goals),
    Boolean(profile.career_profile.writing_style_notes)
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
