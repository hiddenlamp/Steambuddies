import { z } from "zod";

export const createNoteSchema = z.object({
  titleEn: z.string().min(2),
  titleHi: z.string().optional().default(""),
  descEn: z.string().optional().default(""),
  descHi: z.string().optional().default(""),
  tag: z.string().min(2),
  mins: z.coerce.number().int().min(1).max(120).optional().default(5),
  visibility: z.enum(["all", "gradeGroup", "course"]).optional().default("all"),
  gradeGroup: z.string().optional().default(""),
  courseId: z.string().optional().default(""),
});
