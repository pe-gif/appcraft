import { Badge } from "@/components/ui/badge";
import type { TailoredResume } from "@/lib/schemas/kit";

export function ResumeRenderer({ resume }: { resume: TailoredResume }) {
  return (
    <div className="space-y-6 rounded-xl border bg-white p-6">
      <div>
        <h2 className="text-2xl font-bold">{resume.headline ?? "Tailored Resume"}</h2>
        {resume.summary ? <p className="mt-2 text-sm text-muted-foreground">{resume.summary}</p> : null}
      </div>
      {resume.skills.length ? (
        <section>
          <h3 className="font-semibold">Skills</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}
      <section className="space-y-4">
        <h3 className="font-semibold">Experience</h3>
        {resume.experiences.map((experience) => (
          <article key={experience.source_experience_id} className="rounded-lg border p-4">
            <div className="flex flex-col justify-between gap-1 sm:flex-row">
              <div>
                <h4 className="font-semibold">{experience.title}</h4>
                <p className="text-sm text-muted-foreground">{experience.company}</p>
              </div>
              {experience.date_range ? (
                <p className="text-sm text-muted-foreground">{experience.date_range}</p>
              ) : null}
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {experience.bullets.map((bullet, index) => (
                <li key={index}>{highlightKeywords(bullet.text, bullet.ats_keywords)}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}

function highlightKeywords(text: string, keywords: string[]) {
  const uniqueKeywords = Array.from(new Set(keywords.filter(Boolean))).sort(
    (a, b) => b.length - a.length
  );
  if (!uniqueKeywords.length) return text;

  const pattern = new RegExp(`(${uniqueKeywords.map(escapeRegex).join("|")})`, "gi");
  return text.split(pattern).map((part, index) => {
    const matched = uniqueKeywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase());
    return matched ? (
      <mark key={`${part}-${index}`} className="rounded bg-yellow-200 px-1">
        {part}
      </mark>
    ) : (
      part
    );
  });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
