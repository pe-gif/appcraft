import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun
} from "docx";
import type { ApplicationKitRecord } from "@/lib/types";

export async function generateResumeDocx(kit: ApplicationKitRecord) {
  const resume = kit.tailored_resume;
  if (!resume) throw new Error("No resume content to export.");

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: resume.headline ?? kit.application_input?.job_title ?? "Tailored Resume",
            heading: HeadingLevel.TITLE
          }),
          ...(resume.summary
            ? [
                new Paragraph({
                  children: [new TextRun(resume.summary)]
                })
              ]
            : []),
          new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: resume.skills.join(", ") }),
          new Paragraph({ text: "Experience", heading: HeadingLevel.HEADING_2 }),
          ...resume.experiences.flatMap((experience) => [
            new Paragraph({
              children: [
                new TextRun({ text: `${experience.title}, ${experience.company}`, bold: true }),
                new TextRun(experience.date_range ? ` (${experience.date_range})` : "")
              ]
            }),
            ...experience.bullets.map(
              (bullet) =>
                new Paragraph({
                  text: bullet.text,
                  bullet: { level: 0 }
                })
            )
          ]),
          ...(resume.projects.length
            ? [
                new Paragraph({ text: "Projects", heading: HeadingLevel.HEADING_2 }),
                ...resume.projects.map(
                  (project) =>
                    new Paragraph({
                      children: [
                        new TextRun({ text: project.name, bold: true }),
                        new TextRun(`: ${project.description}`)
                      ]
                    })
                )
              ]
            : [])
        ]
      }
    ]
  });

  return Packer.toBlob(doc);
}
