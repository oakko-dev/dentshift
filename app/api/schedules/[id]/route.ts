import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"

// GET single schedule
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const scheduleId = Number(id)

		const schedule = await prisma.schedules.findUnique({
			where: {
				id: BigInt(scheduleId),
			},
			include: {
				places: {
					select: {
						name: true,
						branch: true,
					},
				},
			},
		})

		if (!schedule) {
			return NextResponse.json(
				{ error: "Schedule not found" },
				{ status: 404 },
			)
		}

		return NextResponse.json({
			id: Number(schedule.id),
			place_id: Number(schedule.place_id),
			place_name: schedule.places.name,
			place_branch: schedule.places.branch,
			appointment_date: schedule.appointment_date.toISOString(),
			df_guarantee_amount: Number(schedule.df_guarantee_amount),
			df_percent: Number(schedule.df_percent),
			remark: schedule.remark || "",
			created_at: schedule.created_at.toISOString(),
		})
	}
	catch (error) {
		console.error("Error fetching schedule:", error)
		return NextResponse.json(
			{ error: "Failed to fetch schedule" },
			{ status: 500 },
		)
	}
}

// PUT update schedule
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const scheduleId = Number(id)
		const body = await request.json()

		const { appointment_date, place_id, df_guarantee_amount, df_percent, remark } = body

		const updatedSchedule = await prisma.schedules.update({
			where: {
				id: BigInt(scheduleId),
			},
			data: {
				appointment_date: new Date(appointment_date),
				place_id: BigInt(place_id),
				df_guarantee_amount,
				df_percent,
				remark: remark || null,
			},
		})

		return NextResponse.json({
			id: Number(updatedSchedule.id),
			message: "Schedule updated successfully",
		})
	}
	catch (error) {
		console.error("Error updating schedule:", error)
		return NextResponse.json(
			{ error: "Failed to update schedule" },
			{ status: 500 },
		)
	}
}

// DELETE schedule
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const scheduleId = Number(id)

		await prisma.schedules.delete({
			where: {
				id: BigInt(scheduleId),
			},
		})

		return NextResponse.json({
			message: "Schedule deleted successfully",
		})
	}
	catch (error) {
		console.error("Error deleting schedule:", error)
		return NextResponse.json(
			{ error: "Failed to delete schedule" },
			{ status: 500 },
		)
	}
}
