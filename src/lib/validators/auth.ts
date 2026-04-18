import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Neplatný email"),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Jméno musí mít alespoň 2 znaky"),
    email: z.string().email("Neplatný email"),
    password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Hesla se neshodují",
    path: ["passwordConfirm"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
