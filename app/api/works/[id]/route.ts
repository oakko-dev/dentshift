import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"

// GET single work
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const workId = Number(id)

		const work = await prisma.works.findUnique({
			where: {
				id: BigInt(workId),
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
	}
	catch (error) {
		console.error("Error fetching work:", error)
		return NextResponse.json(
			{ error: "Failed to fetch work" },
			{ status: 500 },
		)
	}
}

// PUT update work
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const workId = Number(id)
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

		const updatedWork = await prisma.works.update({
			where: {
				id: BigInt(workId),
			},
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
			id: Number(updatedWork.id),
			message: "Work updated successfully",
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

// DELETE work
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const workId = Number(id)

		await prisma.works.delete({
			where: {
				id: BigInt(workId),
			},
		})

		return NextResponse.json({
			message: "Work deleted successfully",
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
