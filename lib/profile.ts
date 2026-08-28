import { z } from "zod"

const thaiPhonePattern = /^(?:0[689]\d{8}|\+66[689]\d{8})$/

export function shouldRequireProfileCompletion(profileCompleted: boolean | null | undefined, hasCredentialPassword: boolean): boolean {
	return hasCredentialPassword && profileCompleted === false
}

/** Normalize accepted Thai local numbers and international +66 numbers to E.164. */
export function normalizeThaiPhone(value: string): string {
	const compact = value.replace(/[\s()-]/g, "")
	if (compact.startsWith("0")) {
		if (!/^0[689]\d{8}$/.test(compact))
			throw new Error("Invalid Thai phone number")
		return `+66${compact.slice(1)}`
	}
	if (thaiPhonePattern.test(compact))
		return compact
	throw new Error("Invalid Thai phone number")
}

export const profileSchema = z.object({
	firstname: z.string().trim().min(1, "กรุณาระบุชื่อ"),
	lastname: z.string().trim().min(1, "กรุณาระบุนามสกุล"),
	phoneNumber: z.string().trim().min(1, "กรุณาระบุหมายเลขโทรศัพท์"),
	currentPassword: z.string().optional(),
	newPassword: z.string().optional(),
}).superRefine((data, context) => {
	if (data.newPassword && !data.currentPassword) {
		context.addIssue({ code: "custom", path: ["currentPassword"], message: "กรุณาระบุรหัสผ่านปัจจุบัน" })
	}
	if (data.newPassword && data.newPassword.length < 6) {
		context.addIssue({ code: "too_small", origin: "string", minimum: 6, inclusive: true, path: ["newPassword"], message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" })
	}
})

export type ProfileInput = z.infer<typeof profileSchema>
