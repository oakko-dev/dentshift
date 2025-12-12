import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const page = Number.parseInt(searchParams.get("page") || "0")
		const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")

		const [banks, total] = await Promise.all([
			prisma.banks.findMany({
				skip: page * pageSize,
				take: pageSize,
				orderBy: {
					id: "desc",
				},
			}),
			prisma.banks.count(),
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
	}
	catch (error) {
		console.error("Error fetching banks:", error)
		return NextResponse.json(
			{ error: "Failed to fetch banks" },
			{ status: 500 },
		)
	}
}

// POST create new bank
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { account_name, account_number } = body

		// Remove any non-numeric characters from account_number
		const sanitizedAccountNumber = account_number.replace(/\D/g, "")

		const newBank = await prisma.banks.create({
			data: {
				account_name,
				account_number: sanitizedAccountNumber,
			},
		})

		return NextResponse.json({
			id: Number(newBank.id),
			message: "Bank created successfully",
		}, { status: 201 })
	}
	catch (error) {
		console.error("Error creating bank:", error)
		return NextResponse.json(
			{ error: "Failed to create bank" },
			{ status: 500 },
		)
	}
}

