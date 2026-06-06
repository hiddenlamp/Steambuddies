const { z } = require("zod");

const registerStudentSchema = z.object({
  role: z.literal("student"),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).max(15),
  className: z.string().min(1),
  school: z.string().min(2),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const registerEducatorSchema = z.object({
  role: z.literal("educator"),
  fullName: z.string().min(2),
  email: z.string().email(),
  educatorId: z.string().min(3),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const loginSchema = z.object({
  role: z.enum(["student", "educator"]),
  identifier: z.string().min(2),
  password: z.string().min(1),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

module.exports = {
  registerStudentSchema,
  registerEducatorSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
};
