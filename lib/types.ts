import type { ApplicationNotes, QuestionResponse, TailoredResume } from "@/lib/schemas/kit";
import type { FullUserProfile } from "@/lib/schemas/profile";
import type { JobProfile } from "@/lib/schemas/job-profile";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; name: string | null; created_at: string };
        Insert: { id: string; email: string; name?: string | null; created_at?: string };
        Update: { email?: string; name?: string | null };
      };
      career_profiles: {
        Row: {
          user_id: string;
          goals: string | null;
          interests: string | null;
          extracurriculars: string | null;
          writing_style_notes: string | null;
          target_roles: string[] | null;
          target_industries: string[] | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["career_profiles"]["Row"]> & { user_id: string };
        Update: Partial<Omit<Database["public"]["Tables"]["career_profiles"]["Row"], "user_id">>;
      };
      work_experiences: GenericUserRow;
      projects: GenericUserRow;
      skills: GenericUserRow;
      education: GenericUserRow;
      behavioral_stories: GenericUserRow;
      essays: GenericUserRow;
      application_inputs: GenericUserRow;
      application_kits: GenericUserRow;
      kit_edits: GenericRow;
      application_tracking: GenericUserRow;
    };
  };
};

type GenericRow = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
};

type GenericUserRow = {
  Row: Record<string, unknown> & { user_id: string };
  Insert: Record<string, unknown> & { user_id: string };
  Update: Record<string, unknown>;
};

export type ApplicationListItem = {
  id: string;
  application_input_id: string;
  company_name: string | null;
  job_title: string | null;
  status: string | null;
  created_at: string;
  generation_status: string | null;
};

export type ApplicationKitRecord = {
  id: string;
  application_input_id: string;
  user_id: string;
  tailored_resume: TailoredResume | null;
  cover_letter: string | null;
  question_responses: QuestionResponse[] | null;
  application_notes: ApplicationNotes | null;
  generation_status: string | null;
  generation_error: string | null;
  created_at: string;
  application_input?: {
    job_title: string | null;
    company_name: string | null;
    job_description: string;
    company_description: string | null;
    application_questions: string | null;
    user_notes: string | null;
    job_profile_json: JobProfile | null;
  };
};

export type GenerationSection =
  | { section: "resume"; content: TailoredResume }
  | { section: "cover_letter"; content: string }
  | { section: "questions"; content: QuestionResponse[] }
  | { section: "notes"; content: ApplicationNotes };

export type LoadedProfile = FullUserProfile;
