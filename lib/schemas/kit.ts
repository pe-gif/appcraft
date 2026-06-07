import { z } from "zod";

export const tailoredBulletSchema = z.object({
  text: z.string().min(1),
  source_experience_id: z.string().uuid(),
  ats_keywords: z.array(z.string()).default([])
});

export const tailoredExperienceSchema = z.object({
  source_experience_id: z.string().uuid(),
  company: z.string().min(1),
  title: z.string().min(1),
  date_range: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  bullets: z.array(tailoredBulletSchema).default([])
});

export const tailoredResumeSchema = z.object({
  headline: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  skills: z.array(z.string()).default([]),
  experiences: z.array(tailoredExperienceSchema).default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        technologies: z.array(z.string()).default([])
      })
    )
    .default([]),
  education: z.array(z.string()).default([])
});

export const questionResponseSchema = z.object({
  question: z.string().min(1),
  response: z.string().min(1),
  source_story_ids: z.array(z.string().uuid()).default([]),
  placeholders: z.array(z.string()).default([])
});

export const applicationNotesSchema = z.object({
  missing_info: z.array(z.string()).default([]),
  weak_sections: z.array(z.string()).default([]),
  ats_coverage: z.number().min(0).max(100).default(0),
  suggested_followups: z.array(z.string()).default([])
});

export const applicationKitSchema = z.object({
  resume: tailoredResumeSchema,
  cover_letter: z.string().min(1),
  questions: z.array(questionResponseSchema).default([]),
  notes: applicationNotesSchema
});

export const generateRequestSchema = z.object({
  job_description: z.string().min(1),
  company_description: z.string().optional().nullable(),
  application_questions: z.string().optional().nullable(),
  user_notes: z.string().optional().nullable(),
  user_id: z.string().uuid()
});

export const kitPatchSchema = z.object({
  section: z.enum(["resume", "cover_letter", "questions", "notes", "tracking"]),
  content: z.unknown()
});

export type TailoredBullet = z.infer<typeof tailoredBulletSchema>;
export type TailoredExperience = z.infer<typeof tailoredExperienceSchema>;
export type TailoredResume = z.infer<typeof tailoredResumeSchema>;
export type QuestionResponse = z.infer<typeof questionResponseSchema>;
export type ApplicationNotes = z.infer<typeof applicationNotesSchema>;
export type ApplicationKit = z.infer<typeof applicationKitSchema>;
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type KitPatch = z.infer<typeof kitPatchSchema>;
