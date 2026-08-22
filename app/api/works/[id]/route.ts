import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { requireDentist } from "@/lib/api/require-dentist"
import { assertOwnedBank, assertOwnedSchedule } from "@/lib/db/ownership"
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
		const workId = BigInt(id)
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const work = await db.works.findFirst({
				where: { id: workId, user_id: userId },
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
			})

			if (!work) {
				return NextResponse.json(
					{ error: "Work not found" },
					{ status: 404 },
				)
			}

			return NextResponse.json({
				id: Number(work.id),
				schedule_id: Number(work.schedule_id),
				schedule_place_name: work.schedules.places.name,
				schedule_place_branch: work.schedules.places.branch,
				schedule_appointment_date: work.schedules.appointment_date.toISOString(),
				total_amount: Number(work.total_amount),
				df_amount: Number(work.df_amount),
				bank_id: Number(work.bank_id),
				bank_account_name: work.banks?.account_name,
				bank_account_number: work.banks?.account_number?.toString(),
				forecast_payment_date: work.forecast_payment_date.toISOString(),
				deposit_date: work.deposit_date?.toISOString() || null,
				deposit_amount: work.deposit_amount ? Number(work.deposit_amount) : null,
				remark: work.remark || "",
				created_at: work.created_at.toISOString(),
			})
		})
	}
	catch (error) {
		console.error("Error fetching work:", error)
		return NextResponse.json(
			{ error: "Failed to fetch work" },
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
		const workId = BigInt(id)
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
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const existing = await db.works.findFirst({
				where: { id: workId, user_id: userId },
				select: { id: true },
			})

			if (!existing) {
				return NextResponse.json(
					{ error: "Work not found" },
					{ status: 404 },
				)
			}

			const ownsSchedule = await assertOwnedSchedule(db, BigInt(schedule_id), userId)
			if (!ownsSchedule) {
				return NextResponse.json(
					{ error: "Schedule not found" },
					{ status: 404 },
				)
			}

			if (bank_id) {
				const ownsBank = await assertOwnedBank(db, BigInt(bank_id), userId)
				if (!ownsBank) {
					return NextResponse.json(
						{ error: "Bank not found" },
						{ status: 404 },
					)
				}
			}

			const updatedWork = await db.works.update({
				where: { id: workId },
				data: {
					schedule_id: BigInt(schedule_id),
					total_amount,
					df_amount,
					bank_id: bank_id ? BigInt(bank_id) : null,
					forecast_payment_date: new Date(forecast_payment_date),
					deposit_date: deposit_date ? new Date(deposit_date) : null,
					deposit_amount: deposit_amount || null,
					remark: remark || null,
				},
			})

			return NextResponse.json({
				id: Number(updatedWork.id),
				message: "Work updated successfully",
			})
		})
	}
	catch (error) {
		console.error("Error updating work:", error)
		return NextResponse.json(
			{ error: "Failed to update work" },
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
		const workId = BigInt(id)
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const existing = await db.works.findFirst({
				where: { id: workId, user_id: userId },
				select: { id: true },
			})

			if (!existing) {
				return NextResponse.json(
					{ error: "Work not found" },
					{ status: 404 },
				)
			}

			await db.works.delete({
				where: { id: workId },
			})

			return NextResponse.json({
				message: "Work deleted successfully",
			})
		})
	}
	catch (error) {
		console.error("Error deleting work:", error)
		return NextResponse.json(
			{ error: "Failed to delete work" },
			{ status: 500 },
		)
	}
}
