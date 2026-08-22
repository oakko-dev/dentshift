import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { requireDentist } from "@/lib/api/require-dentist"
import { withDentist } from "@/lib/db/with-dentist"

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const { id } = await params
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const bank = await db.banks.findFirst({
				where: { id: BigInt(id), user_id: userId },
			})

			if (!bank) {
				return NextResponse.json(
					{ error: "Bank not found" },
					{ status: 404 },
				)
			}

			return NextResponse.json({
				id: Number(bank.id),
				account_name: bank.account_name,
				account_number: bank.account_number.toString(),
			})
		})
	}
	catch (error) {
		console.error("Error fetching bank:", error)
		return NextResponse.json(
			{ error: "Failed to fetch bank" },
			{ status: 500 },
		)
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const { id } = await params
		const body = await request.json()
		const { account_name, account_number } = body
		const userId = authResult.session.user.id
		const sanitizedAccountNumber = account_number.replace(/\D/g, "")

		return await withDentist(userId, async (db) => {
			const existing = await db.banks.findFirst({
				where: { id: BigInt(id), user_id: userId },
				select: { id: true },
			})

			if (!existing) {
				return NextResponse.json(
					{ error: "Bank not found" },
					{ status: 404 },
				)
			}

			const updatedBank = await db.banks.update({
				where: { id: BigInt(id) },
				data: {
					account_name,
					account_number: sanitizedAccountNumber,
				},
			})

			return NextResponse.json({
				id: Number(updatedBank.id),
				message: "Bank updated successfully",
			})
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
		console.error("Error updating bank:", error)
		return NextResponse.json(
			{ error: "Failed to update bank" },
			{ status: 500 },
		)
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const { id } = await params
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const existing = await db.banks.findFirst({
				where: { id: BigInt(id), user_id: userId },
				select: { id: true },
			})

			if (!existing) {
				return NextResponse.json(
					{ error: "Bank not found" },
					{ status: 404 },
				)
			}

			await db.banks.delete({
				where: { id: BigInt(id) },
			})

			return NextResponse.json({
				message: "Bank deleted successfully",
			})
		})
	}
	catch (error) {
		console.error("Error deleting bank:", error)
		return NextResponse.json(
			{ error: "Failed to delete bank" },
			{ status: 500 },
		)
	}
}
