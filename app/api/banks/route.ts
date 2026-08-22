import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { requireDentist } from "@/lib/api/require-dentist"
import { withDentist } from "@/lib/db/with-dentist"

export async function GET(request: NextRequest) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const searchParams = request.nextUrl.searchParams
		const page = Number.parseInt(searchParams.get("page") || "0")
		const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const [banks, total] = await Promise.all([
				db.banks.findMany({
					where: { user_id: userId },
					skip: page * pageSize,
					take: pageSize,
					orderBy: {
						id: "desc",
					},
				}),
				db.banks.count({ where: { user_id: userId } }),
			])

			return NextResponse.json({
				data: banks.map(bank => ({
					id: Number(bank.id),
					account_name: bank.account_name,
					account_number: bank.account_number.toString(),
				})),
				total,
				allIds: banks.map(bank => Number(bank.id)),
			})
		})
	}
	catch (error) {
		console.error("Error fetching banks:", error)
		return NextResponse.json(
			{ error: "Failed to fetch banks" },
			{ status: 500 },
		)
	}
}

export async function POST(request: NextRequest) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const body = await request.json()
		const { account_name, account_number } = body
		const userId = authResult.session.user.id

		const sanitizedAccountNumber = account_number.replace(/\D/g, "")

		return await withDentist(userId, async (db) => {
			const newBank = await db.banks.create({
				data: {
					user_id: userId,
					account_name,
					account_number: sanitizedAccountNumber,
				},
			})

			return NextResponse.json({
				id: Number(newBank.id),
				message: "Bank created successfully",
			}, { status: 201 })
		})
	}
	catch (error: unknown) {
		if (
			error
			&& typeof error === "object"
			&& "code" in error
			&& error.code === "P2002"
		) {
			return NextResponse.json(
				{ error: "Account number already exists for this dentist" },
				{ status: 409 },
			)
		}
		console.error("Error creating bank:", error)
		return NextResponse.json(
			{ error: "Failed to create bank" },
			{ status: 500 },
		)
	}
}
