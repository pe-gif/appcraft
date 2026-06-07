import Anthropic from "@anthropic-ai/sdk";
import {
  applicationKitSchema,
  type ApplicationKit
} from "@/lib/schemas/kit";
import type { JobProfile } from "@/lib/schemas/job-profile";
import type { FullUserProfile } from "@/lib/schemas/profile";
import type { GenerationSection } from "@/lib/types";

const SONNET_MODEL = "claude-sonnet-4-20250514";
const FORBIDDEN_COVER_LETTER_START = "i am writing to express my interest";

export async function* tailorApplication(
  jobProfile: JobProfile,
  userProfile: FullUserProfile
): AsyncGenerator<GenerationSection> {
  const kit = process.env.ANTHROPIC_API_KEY
    ? await generateWithClaude(jobProfile, userProfile)
    : buildFallbackKit(jobProfile, userProfile);

  const sanitized = enforceSourceExperienceIds(kit, userProfile);
  const questions = ensureQuestionCoverage(sanitized, jobProfile);

  yield { section: "resume", content: sanitized.resume };
  yield { section: "cover_letter", content: sanitizeCoverLetter(sanitized.cover_letter, jobProfile) };
  yield { section: "questions", content: questions };
  yield { section: "notes", content: sanitized.notes };
}

async function generateWithClaude(
  jobProfile: JobProfile,
  userProfile: FullUserProfile
): Promise<ApplicationKit> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const stream = await anthropic.messages.create({
    model: SONNET_MODEL,
    max_tokens: 5000,
    temperature: 0.3,
    stream: true,
    system:
      "You are AppCraft, an expert application materials generator. Return only valid JSON matching the requested schema. Every resume bullet must include a source_experience_id from the provided user profile. Never invent employment history.",
    messages: [
      {
        role: "user",
        content: buildTailoringPrompt(jobProfile, userProfile)
      }
    ]
  });

  let text = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      text += event.delta.text;
    }
  }

  const json = extractJson(text);
  return applicationKitSchema.parse(JSON.parse(json));
}

function buildTailoringPrompt(jobProfile: JobProfile, userProfile: FullUserProfile) {
  return [
    "Create a tailored application kit as JSON with this shape:",
    JSON.stringify(applicationKitSchema.describe("ApplicationKit")._def, null, 2),
    "",
    "Rules:",
    "- cover_letter must not start with 'I am writing to express my interest'.",
    "- Answer every application question in job_profile.application_questions.",
    "- Mark unknown personal details with [NOTE: add your own detail].",
    "- Each resume bullet must include source_experience_id from user_profile.work_experiences.",
    "- Keep the cover letter under 320 words.",
    "",
    "job_profile:",
    JSON.stringify(jobProfile, null, 2),
    "",
    "user_profile:",
    JSON.stringify(userProfile, null, 2)
  ].join("\n");
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fenced) return fenced.trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("Claude response did not include JSON.");
}

function enforceSourceExperienceIds(kit: ApplicationKit, userProfile: FullUserProfile) {
  const validExperienceIds = new Set(
    userProfile.work_experiences.map((experience) => experience.id).filter(Boolean)
  );

  kit.resume.experiences = kit.resume.experiences
    .filter((experience) => validExperienceIds.has(experience.source_experience_id))
    .map((experience) => ({
      ...experience,
      bullets: experience.bullets.filter((bullet) => {
        const isValid = validExperienceIds.has(bullet.source_experience_id);
        if (!isValid) {
          console.warn(
            `Dropping generated bullet with invalid source_experience_id: ${bullet.source_experience_id}`
          );
        }
        return isValid;
      })
    }));

  return kit;
}

function ensureQuestionCoverage(kit: ApplicationKit, jobProfile: JobProfile) {
  const existing = new Map(kit.questions.map((item) => [normalizeQuestion(item.question), item]));
  const allQuestions = jobProfile.application_questions;

  for (const question of allQuestions) {
    if (!existing.has(normalizeQuestion(question))) {
      kit.questions.push({
        question,
        response:
          "This answer should connect your background to the role. [NOTE: add your own detail about a specific example before submitting.]",
        source_story_ids: [],
        placeholders: ["add your own detail about a specific example before submitting"]
      });
    }
  }

  return kit.questions;
}

function normalizeQuestion(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function sanitizeCoverLetter(value: string, jobProfile: JobProfile) {
  if (!value.trim().toLowerCase().startsWith(FORBIDDEN_COVER_LETTER_START)) {
    return value;
  }

  const role = jobProfile.job_title ?? "this role";
  const company = jobProfile.company_name ?? "your team";
  return `Your ${role} opportunity at ${company} stands out because it connects directly to the work I have been building toward.\n\n${value
    .split(/\n+/)
    .slice(1)
    .join("\n\n")}`;
}

function buildFallbackKit(jobProfile: JobProfile, userProfile: FullUserProfile): ApplicationKit {
  const topExperiences = userProfile.work_experiences.slice(0, 3);
  const keywords = jobProfile.ats_keywords.slice(0, 8);
  const skillNames = userProfile.skills.map((skill) => skill.name).slice(0, 12);
  const role = jobProfile.job_title ?? "the target role";
  const company = jobProfile.company_name ?? "the company";

  return applicationKitSchema.parse({
    resume: {
      headline: `${role} candidate`,
      summary: `Profile tailored for ${company}, emphasizing ${[
        ...keywords.slice(0, 4),
        ...skillNames.slice(0, 4)
      ]
        .filter(Boolean)
        .join(", ")}.`,
      skills: Array.from(new Set([...keywords, ...skillNames])).slice(0, 16),
      experiences: topExperiences
        .filter((experience) => experience.id)
        .map((experience) => ({
          source_experience_id: experience.id!,
          company: experience.company,
          title: experience.title,
          date_range: formatDateRange(experience.start_date, experience.end_date, experience.is_current),
          summary: experience.description,
          bullets: (experience.bullets.length ? experience.bullets : [experience.description ?? ""])
            .filter(Boolean)
            .slice(0, 3)
            .map((bullet) => ({
              text: `${bullet} ${keywords[0] ? `Relevant keyword: ${keywords[0]}.` : ""}`.trim(),
              source_experience_id: experience.id!,
              ats_keywords: keywords.slice(0, 3)
            }))
        })),
      projects: userProfile.projects.slice(0, 2).map((project) => ({
        name: project.name,
        description: project.description ?? project.outcomes ?? "Relevant project experience.",
        technologies: project.tech_stack
      })),
      education: userProfile.education.map((education) =>
        [education.degree, education.field, education.institution].filter(Boolean).join(", ")
      )
    },
    cover_letter: `The ${role} opportunity at ${company} matches the direction of my recent work and the strengths reflected in my profile.\n\nMy experience across ${topExperiences
      .map((experience) => experience.title)
      .filter(Boolean)
      .slice(0, 2)
      .join(" and ")} has prepared me to contribute to priorities such as ${jobProfile.responsibilities
      .slice(0, 2)
      .join(" and ")}.\n\nI would be glad to bring this background to ${company} and discuss how it can support the team.`,
    questions: jobProfile.application_questions.map((question) => ({
      question,
      response:
        "A strong answer should reference a specific achievement from your profile and connect it to this role. [NOTE: add a concrete metric or personal detail before submitting.]",
      source_story_ids: [],
      placeholders: ["add a concrete metric or personal detail before submitting"]
    })),
    notes: {
      missing_info: userProfile.work_experiences.length
        ? []
        : ["Add work experiences so generated resume bullets can cite real sources."],
      weak_sections: keywords.length ? [] : ["Job profile has limited ATS keyword extraction."],
      ats_coverage: keywords.length ? 75 : 35,
      suggested_followups: ["Review all [NOTE: ...] placeholders before submitting."]
    }
  });
}

function formatDateRange(start?: string | null, end?: string | null, isCurrent?: boolean) {
  if (!start && !end) return null;
  return `${start ?? ""} - ${isCurrent ? "Present" : end ?? ""}`.trim();
}
