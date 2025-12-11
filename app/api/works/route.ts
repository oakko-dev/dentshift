import type { NextRequest } from "next/server"

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const page = Number.parseInt(searchParams.get("page") || "0")
		const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
		const sortBy = searchParams.get("sortBy") || "created_at"
		const sortOrder = searchParams.get("sortOrder") || "desc"

		// Validate sortBy to prevent SQL injection
		const allowedSortFields = ["created_at", "forecast_payment_date", "deposit_date"]
		const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at"
		const validSortOrder = sortOrder === "asc" ? "asc" : "desc"

		const [works, total] = await Promise.all([
			prisma.works.findMany({
				skip: page * pageSize,
				take: pageSize,
				orderBy: {
					[validSortBy]: validSortOrder,
				},
				include: {
					schedules: {
						select: {
							appointment_date: true,
							places: {
								select: {
									name: true,
									branch: true,
								},
							},
						},
					},
					banks: {
						select: {
							account_name: true,
							account_number: true,
						},
					},
				},
			}),
			prisma.works.count(),
		])

		return NextResponse.json({
			data: works.map(work => ({
				id: Number(work.id),
				schedule_id: Number(work.schedule_id),
				schedule_place_name: work.schedules.places.name,
				schedule_place_branch: work.schedules.places.branch,
				schedule_appointment_date: work.schedules.appointment_date.toISOString(),
				total_amount: Number(work.total_amount),
				df_amount: Number(work.df_amount),
				bank_id: Number(work.bank_id),
				bank_account_name: work.banks?.account_name ?? null,
				bank_account_number: work.banks?.account_number?.toString() ?? null,
				forecast_payment_date: work.forecast_payment_date.toISOString(),
				deposit_date: work.deposit_date?.toISOString() || null,
				deposit_amount: work.deposit_amount ? Number(work.deposit_amount) : null,
				remark: work.remark || "",
				created_at: work.created_at.toISOString(),
			})),
			total,
			allIds: works.map(work => Number(work.id)),
		})
	}
	catch (error) {
		console.error("Error fetching works:", error)
		return NextResponse.json(
			{ error: "Failed to fetch works" },
			{ status: 500 },
		)
	}
}

// POST create new work
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const {
			schedule_id,
			total_amount,
			df_amount,
			bank_id,
			forecast_payment_date,
			deposit_date,
			deposit_amount,
			remark,
		} = body

		const newWork = await prisma.works.create({
			data: {
				schedule_id: BigInt(schedule_id),
				total_amount,
				df_amount,
				bank_id: BigInt(bank_id),
				forecast_payment_date: new Date(forecast_payment_date),
				deposit_date: deposit_date ? new Date(deposit_date) : null,
				deposit_amount: deposit_amount || null,
				remark: remark || null,
			},
		})

		return NextResponse.json({
			id: Number(newWork.id),
			message: "Work created successfully",
		}, { status: 201 })
	}
	catch (error) {
		console.error("Error creating work:", error)
		return NextResponse.json(
			{ error: "Failed to create work" },
			{ status: 500 },
		)
	}
}
