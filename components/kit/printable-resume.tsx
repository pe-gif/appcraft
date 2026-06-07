import type { TailoredResume } from "@/lib/schemas/kit";

export function PrintableResume({ resume }: { resume: TailoredResume }) {
  return (
    <article className="bg-white p-8 text-slate-950 print:p-0">
      <style>{`
        @media print {
          .printable-resume {
            color: #111827;
            font-family: Arial, sans-serif;
            font-size: 10.5pt;
            line-height: 1.35;
          }
          .printable-resume h1 { font-size: 18pt; margin: 0 0 8pt; }
          .printable-resume h2 { font-size: 11pt; border-bottom: 1px solid #111827; margin: 12pt 0 5pt; }
          .printable-resume ul { margin: 4pt 0 0 16pt; padding: 0; }
        }
      `}</style>
      <div className="printable-resume">
        <h1 className="text-2xl font-bold">{resume.headline ?? "Tailored Resume"}</h1>
        {resume.summary ? <p className="text-sm">{resume.summary}</p> : null}
        {resume.skills.length ? (
          <section>
            <h2 className="mt-5 border-b font-semibold uppercase tracking-wide">Skills</h2>
            <p className="text-sm">{resume.skills.join(", ")}</p>
          </section>
        ) : null}
        <section>
          <h2 className="mt-5 border-b font-semibold uppercase tracking-wide">Experience</h2>
          {resume.experiences.map((experience) => (
            <div key={experience.source_experience_id} className="mt-3">
              <div className="flex justify-between gap-4">
                <p className="font-semibold">
                  {experience.title}, {experience.company}
                </p>
                {experience.date_range ? <p className="text-sm">{experience.date_range}</p> : null}
              </div>
              <ul className="list-disc pl-5 text-sm">
                {experience.bullets.map((bullet, index) => (
                  <li key={index}>{bullet.text}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        {resume.projects.length ? (
          <section>
            <h2 className="mt-5 border-b font-semibold uppercase tracking-wide">Projects</h2>
            {resume.projects.map((project) => (
              <p key={project.name} className="text-sm">
                <strong>{project.name}:</strong> {project.description}
              </p>
            ))}
          </section>
        ) : null}
      </div>
    </article>
  );
}
