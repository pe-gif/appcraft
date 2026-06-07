import Anthropic from "@anthropic-ai/sdk";
import createInstructor from "@instructor-ai/instructor";
import { z } from "zod";
import {
  jobProfileSchema,
  type JobProfile,
  type ReaderInput
} from "@/lib/schemas/job-profile";

const HAIKU_MODEL = "claude-haiku-4-20250514";

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export async function readJobPosting(input: ReaderInput): Promise<JobProfile> {
  if (wordCount(input.job_description) < 80) {
    return {
      insufficient_content: true,
      job_title: null,
      company_name: null,
      seniority: null,
      role_summary: null,
      required_skills: [],
      preferred_skills: [],
      responsibilities: [],
      ats_keywords: [],
      company_values: [],
      application_questions: [],
      risks_or_gaps: ["Job description is under 80 words."],
      parse_errors: []
    };
  }

  const prompt = [
    "Extract a structured job profile for tailoring a resume and application materials.",
    "Identify job title, company name, seniority, role summary, requirements, ATS keywords, values, and every application question.",
    "Return concise strings. Never invent facts not present in the input.",
    "",
    `Job description:\n${input.job_description}`,
    input.company_description ? `\nCompany description:\n${input.company_description}` : "",
    input.application_questions ? `\nApplication questions:\n${input.application_questions}` : "",
    input.user_notes ? `\nUser notes:\n${input.user_notes}` : ""
  ].join("\n");

  const instructor = createInstructor({
    client: createAnthropicInstructorAdapter(),
    mode: "MD_JSON" as never,
    retryAllErrors: true
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await instructor.chat.completions.create({
        model: HAIKU_MODEL,
        max_tokens: 1400,
        temperature: 0.1,
        messages: [{ role: "user", content: prompt }],
        response_model: {
          name: "JobProfile",
          schema: jobProfileSchema
        },
        max_retries: 0
      });

      return jobProfileSchema.parse(result);
    } catch (error) {
      if (attempt === 0) continue;

      const message = error instanceof Error ? error.message : "Unknown parse failure";
      return {
        insufficient_content: false,
        job_title: null,
        company_name: null,
        seniority: null,
        role_summary: null,
        required_skills: [],
        preferred_skills: [],
        responsibilities: [],
        ats_keywords: [],
        company_values: [],
        application_questions: splitQuestions(input.application_questions),
        risks_or_gaps: [],
        parse_errors: [message]
      };
    }
  }

  return jobProfileSchema.parse({ parse_errors: ["Unexpected reader failure"] });
}

function splitQuestions(value?: string | null) {
  if (!value) return [];
  return value
    .split(/\n+/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((line) => line.endsWith("?") || line.length > 12);
}

function createAnthropicInstructorAdapter() {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  return {
    baseURL: "https://api.anthropic.com",
    chat: {
      completions: {
        create: async (params: {
          model: string;
          messages: Array<{ role: string; content: string }>;
          max_tokens?: number | null;
          temperature?: number;
        }) => {
          const systemMessages = params.messages
            .filter((message) => message.role === "system")
            .map((message) => message.content)
            .join("\n\n");
          const messages = params.messages
            .filter((message) => message.role !== "system")
            .map((message) => ({
              role: message.role === "assistant" ? ("assistant" as const) : ("user" as const),
              content: message.content
            }));

          const response = await anthropic.messages.create({
            model: params.model,
            max_tokens: params.max_tokens ?? 1400,
            temperature: params.temperature ?? 0.1,
            system: systemMessages || undefined,
            messages
          });

          const content = response.content
            .map((block) => (block.type === "text" ? block.text : ""))
            .join("");

          return {
            id: response.id,
            model: response.model,
            usage: {
              prompt_tokens: response.usage.input_tokens,
              completion_tokens: response.usage.output_tokens,
              total_tokens: response.usage.input_tokens + response.usage.output_tokens
            },
            choices: [
              {
                message: {
                  role: "assistant",
                  content
                }
              }
            ]
          };
        }
      }
    }
  };
}

export type ReaderAgentResult = z.infer<typeof jobProfileSchema>;
