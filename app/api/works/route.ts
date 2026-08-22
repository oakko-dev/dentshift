import type { NextRequest } from "next/server"

import { NextResponse } from "next/server"
import { requireDentist } from "@/lib/api/require-dentist"
import { assertOwnedBank, assertOwnedSchedule } from "@/lib/db/ownership"
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
		const sortBy = searchParams.get("sortBy") || "created_at"
		const sortOrder = searchParams.get("sortOrder") || "desc"
		const includeDeposited = searchParams.get("includeDeposited") !== "false"
		const userId = authResult.session.user.id

		const allowedSortFields = ["created_at", "forecast_payment_date", "deposit_date", "appointment_date"]
		const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at"
		const validSortOrder = sortOrder === "asc" ? "asc" : "desc"

		const where = {
			user_id: userId,
			...(includeDeposited
				? {}
				: { deposit_date: null }),
		}

		return await withDentist(userId, async (db) => {
			const [works, total] = await Promise.all([
				db.works.findMany({
					where,
					skip: page * pageSize,
					take: pageSize,
					orderBy: sortBy === "appointment_date"
						? {
								schedules: {
									appointment_date: validSortOrder,
								},
							}
						: {
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
				db.works.count({ where }),
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

export async function POST(request: NextRequest) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

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
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
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

			const newWork = await db.works.create({
				data: {
					user_id: userId,
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
				id: Number(newWork.id),
				message: "Work created successfully",
			}, { status: 201 })
		})
	}
	catch (error) {
		console.error("Error creating work:", error)
		return NextResponse.json(
			{ error: "Failed to create work" },
			{ status: 500 },
		)
	}
}
