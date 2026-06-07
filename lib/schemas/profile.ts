import { z } from "zod";

const nullableText = z.string().trim().optional().nullable();
const textArray = z.array(z.string().trim().min(1)).default([]);

export const careerProfileSchema = z.object({
  goals: nullableText,
  interests: nullableText,
  extracurriculars: nullableText,
  writing_style_notes: nullableText,
  target_roles: textArray,
  target_industries: textArray
});

export const workExperienceSchema = z.object({
  id: z.string().uuid().optional(),
  company: z.string().trim().min(1),
  title: z.string().trim().min(1),
  start_date: nullableText,
  end_date: nullableText,
  is_current: z.boolean().default(false),
  description: nullableText,
  bullets: textArray,
  achievements: textArray,
  technologies: textArray,
  display_order: z.number().int().default(0)
});

export const projectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1),
  description: nullableText,
  role: nullableText,
  tech_stack: textArray,
  outcomes: nullableText,
  url: nullableText,
  is_featured: z.boolean().default(false)
});

export const skillSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1),
  category: nullableText,
  proficiency: nullableText
});

export const educationSchema = z.object({
  id: z.string().uuid().optional(),
  institution: z.string().trim().min(1),
  degree: nullableText,
  field: nullableText,
  graduation_year: z.number().int().min(1900).max(2200).optional().nullable(),
  gpa: nullableText,
  honors: nullableText,
  activities: textArray
});

export const behavioralStorySchema = z.object({
  id: z.string().uuid().optional(),
  title: nullableText,
  themes: textArray,
  situation: z.string().trim().min(1),
  task: z.string().trim().min(1),
  action: z.string().trim().min(1),
  result: z.string().trim().min(1),
  company_context: nullableText
});

export const essaySchema = z.object({
  id: z.string().uuid().optional(),
  prompt: nullableText,
  response: z.string().trim().min(1),
  theme: nullableText
});

export const fullUserProfileSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: nullableText
  }),
  career_profile: careerProfileSchema.default({}),
  work_experiences: z.array(workExperienceSchema).default([]),
  projects: z.array(projectSchema).default([]),
  skills: z.array(skillSchema).default([]),
  education: z.array(educationSchema).default([]),
  behavioral_stories: z.array(behavioralStorySchema).default([]),
  essays: z.array(essaySchema).default([])
});

export const saveProfileSchema = fullUserProfileSchema.omit({ user: true });

export type CareerProfile = z.infer<typeof careerProfileSchema>;
export type WorkExperience = z.infer<typeof workExperienceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Education = z.infer<typeof educationSchema>;
export type BehavioralStory = z.infer<typeof behavioralStorySchema>;
export type Essay = z.infer<typeof essaySchema>;
export type FullUserProfile = z.infer<typeof fullUserProfileSchema>;
export type SaveProfileInput = z.infer<typeof saveProfileSchema>;
