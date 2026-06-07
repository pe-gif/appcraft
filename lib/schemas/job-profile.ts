import { z } from "zod";

export const jobProfileSchema = z.object({
  insufficient_content: z.boolean().default(false),
  job_title: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  seniority: z.string().optional().nullable(),
  role_summary: z.string().optional().nullable(),
  required_skills: z.array(z.string()).default([]),
  preferred_skills: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  ats_keywords: z.array(z.string()).default([]),
  company_values: z.array(z.string()).default([]),
  application_questions: z.array(z.string()).default([]),
  risks_or_gaps: z.array(z.string()).default([]),
  parse_errors: z.array(z.string()).default([])
});

export const readerInputSchema = z.object({
  job_description: z.string().min(1),
  company_description: z.string().optional().nullable(),
  application_questions: z.string().optional().nullable(),
  user_notes: z.string().optional().nullable()
});

export type JobProfile = z.infer<typeof jobProfileSchema>;
export type ReaderInput = z.infer<typeof readerInputSchema>;
