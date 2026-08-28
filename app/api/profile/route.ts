import { compare, hash } from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"
import { requireDentist } from "@/lib/api/require-dentist"
import prisma from "@/lib/prisma"
import { normalizeThaiPhone, profileSchema, shouldRequireProfileCompletion } from "@/lib/profile"

async function getProfileState(userId: string) {
	const user = await prisma.users.findUnique({
		where: { id: userId },
		select: { firstname: true, lastname: true, phone_number: true, profileCompleted: true },
	})
	const credential = await prisma.accounts.findFirst({
		where: { userId, providerId: "credential" },
		select: { id: true, password: true },
	})
	return {
		user,
		credential,
		requiresProfileCompletion: shouldRequireProfileCompletion(user?.profileCompleted, Boolean(credential?.password)),
	}
}

export async function GET(request: NextRequest) {
	const required = await requireDentist(request)
	if (required.error)
		return required.error

	try {
		const state = await getProfileState(required.session.user.id)
		if (!state.user)
			return NextResponse.json({ error: "User not found" }, { status: 404 })
		return NextResponse.json({
			firstname: state.user.firstname,
			lastname: state.user.lastname,
			phoneNumber: state.user.phone_number,
			profileCompleted: state.user.profileCompleted,
			requiresProfileCompletion: state.requiresProfileCompletion,
		})
	}
	catch (error) {
		console.error("Error fetching profile:", error)
		return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
	}
}

export async function PATCH(request: NextRequest) {
	const required = await requireDentist(request)
	if (required.error)
		return required.error

	try {
		const parsed = profileSchema.safeParse(await request.json())
		if (!parsed.success)
			return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile" }, { status: 400 })

		const input = parsed.data
		const phoneNumber = normalizeThaiPhone(input.phoneNumber)
		const result = await prisma.$transaction(async (transaction) => {
			const user = await transaction.users.findUnique({
				where: { id: required.session.user.id },
				select: { profileCompleted: true },
			})
			const credential = await transaction.accounts.findFirst({
				where: { userId: required.session.user.id, providerId: "credential" },
				select: { id: true, password: true },
			})
			if (!user)
				throw new Error("USER_NOT_FOUND")

			const isCompletingProfile = shouldRequireProfileCompletion(user.profileCompleted, Boolean(credential?.password))
			if (isCompletingProfile && !credential?.password)
				throw new Error("PASSWORD_ACCOUNT_REQUIRED")
			if (isCompletingProfile && (!input.currentPassword || !input.newPassword))
				throw new Error("PASSWORD_REQUIRED")
			if (input.newPassword) {
				if (!input.currentPassword || !credential?.password || !await compare(input.currentPassword, credential.password))
					throw new Error("INVALID_CURRENT_PASSWORD")
				await transaction.accounts.update({ where: { id: credential.id }, data: { password: await hash(input.newPassword, 12) } })
			}
			return transaction.users.update({
				where: { id: required.session.user.id },
				data: {
					firstname: input.firstname.trim(),
					lastname: input.lastname.trim(),
					phone_number: phoneNumber,
					...(isCompletingProfile ? { profileCompleted: true } : {}),
				},
				select: { firstname: true, lastname: true, phone_number: true, profileCompleted: true },
			})
		})
		return NextResponse.json({
			firstname: result.firstname,
			lastname: result.lastname,
			phoneNumber: result.phone_number,
			profileCompleted: result.profileCompleted,
		})
	}
	catch (error) {
		const message = error instanceof Error ? error.message : ""
		const status = message === "USER_NOT_FOUND" ? 404 : ["PASSWORD_REQUIRED", "INVALID_CURRENT_PASSWORD", "PASSWORD_ACCOUNT_REQUIRED"].includes(message) ? 400 : message === "Invalid Thai phone number" ? 400 : 500
		if (status === 500)
			console.error("Error updating profile:", error)
		return NextResponse.json({ error: status === 500 ? "Failed to update profile" : message }, { status })
	}
}
