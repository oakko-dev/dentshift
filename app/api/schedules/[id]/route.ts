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
		const scheduleId = BigInt(id)
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const schedule = await db.schedules.findFirst({
				where: { id: scheduleId, user_id: userId },
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
		const scheduleId = BigInt(id)
		const body = await request.json()
		const { appointment_date, place_id, df_guarantee_amount, df_percent, remark } = body
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const existing = await db.schedules.findFirst({
				where: { id: scheduleId, user_id: userId },
				select: { id: true },
			})

			if (!existing) {
				return NextResponse.json(
					{ error: "Schedule not found" },
					{ status: 404 },
				)
			}

			const updatedSchedule = await db.schedules.update({
				where: { id: scheduleId },
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
		const scheduleId = BigInt(id)
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const existing = await db.schedules.findFirst({
				where: { id: scheduleId, user_id: userId },
				select: { id: true },
			})

			if (!existing) {
				return NextResponse.json(
					{ error: "Schedule not found" },
					{ status: 404 },
				)
			}

			await db.schedules.delete({
				where: { id: scheduleId },
			})

			return NextResponse.json({
				message: "Schedule deleted successfully",
			})
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
