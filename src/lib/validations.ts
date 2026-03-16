import { z } from "zod";

export const createCaseSchema = z.object({
    fullName: z
        .string()
        .min(2, "กรุณาระบุชื่อ-นามสกุล (อย่างน้อย 2 ตัวอักษร)"),
    phone: z
        .string()
        .regex(/^0[0-9]{9}$/, "เบอร์โทรศัพท์ต้องมี 10 หลัก (เช่น 0812345678)"),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
    lineId: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    hospitalId: z.string().optional().or(z.literal("")),
    categoryId: z.string().min(1, "กรุณาเลือกประเภทปัญหา"),
    problemSummary: z
        .string()
        .min(5, "กรุณาระบุหัวข้อปัญหา (อย่างน้อย 5 ตัวอักษร)"),
    description: z.string().optional().or(z.literal("")),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;

export const loginSchema = z.object({
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const caseUpdateSchema = z.object({
    note: z.string().min(1, "กรุณาระบุหมายเหตุ"),
    status: z.string().optional(),
});

export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>;

export const csatSchema = z.object({
    score: z.number().min(1).max(5),
    comment: z.string().optional().or(z.literal("")),
});

export type CSATInput = z.infer<typeof csatSchema>;
