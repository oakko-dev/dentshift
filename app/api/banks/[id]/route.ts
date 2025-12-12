import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"

// GET single bank by id
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const bank = await prisma.banks.findUnique({
			where: { id: BigInt(id) },
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
	}
	catch (error) {
		console.error("Error fetching bank:", error)
		return NextResponse.json(
			{ error: "Failed to fetch bank" },
			{ status: 500 },
		)
	}
}

// PUT update bank
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const body = await request.json()
		const { account_name, account_number } = body

		// Remove any non-numeric characters from account_number
		const sanitizedAccountNumber = account_number.replace(/\D/g, "")

		const updatedBank = await prisma.banks.update({
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
	}
	catch (error) {
		console.error("Error updating bank:", error)
		return NextResponse.json(
			{ error: "Failed to update bank" },
			{ status: 500 },
		)
	}
}

// DELETE bank
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		await prisma.banks.delete({
			where: { id: BigInt(id) },
		})

		return NextResponse.json({
			message: "Bank deleted successfully",
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
