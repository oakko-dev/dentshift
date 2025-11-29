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
		const allowedSortFields = ["created_at", "appointment_date"]
		const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at"
		const validSortOrder = sortOrder === "asc" ? "asc" : "desc"

		const [schedules, total] = await Promise.all([
			prisma.schedules.findMany({
				skip: page * pageSize,
				take: pageSize,
				orderBy: {
					[validSortBy]: validSortOrder,
				},
				include: {
					places: {
						select: {
							name: true,
							branch: true,
						},
					},
				},
			}),
			prisma.schedules.count(),
		])

		return NextResponse.json({
			data: schedules.map(schedule => ({
				id: Number(schedule.id),
				place_id: Number(schedule.place_id),
				place_name: schedule.places.name,
				place_branch: schedule.places.branch,
				appointment_date: schedule.appointment_date.toISOString(),
				df_guarantee_amount: Number(schedule.df_guarantee_amount),
				df_percent: Number(schedule.df_percent),
				remark: schedule.remark || "",
				created_at: schedule.created_at.toISOString(),
			})),
			total,
			allIds: schedules.map(schedule => Number(schedule.id)),
		})
	}
	catch (error) {
		console.error("Error fetching schedules:", error)
		return NextResponse.json(
			{ error: "Failed to fetch schedules" },
			{ status: 500 },
		)
	}
}

// POST create new schedule
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { appointment_date, place_id, df_guarantee_amount, df_percent, remark } = body

		const newSchedule = await prisma.schedules.create({
			data: {
				appointment_date: new Date(appointment_date),
				place_id: BigInt(place_id),
				df_guarantee_amount,
				df_percent,
				remark: remark || null,
			},
		})

		return NextResponse.json({
			id: Number(newSchedule.id),
			message: "Schedule created successfully",
		}, { status: 201 })
	}
	catch (error) {
		console.error("Error creating schedule:", error)
		return NextResponse.json(
			{ error: "Failed to create schedule" },
			{ status: 500 },
		)
	}
}
