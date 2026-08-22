import type { NextRequest } from "next/server"

import { NextResponse } from "next/server"
import { requireDentist } from "@/lib/api/require-dentist"
import { withDentist } from "@/lib/db/with-dentist"
import { sendNotificationToUser } from "@/lib/push-notifications"

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
		const includePastParam = searchParams.get("includePast")
		const includePast = includePastParam !== "false"
		const userId = authResult.session.user.id

		const allowedSortFields = ["created_at", "appointment_date"]
		const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at"
		const validSortOrder = sortOrder === "asc" ? "asc" : "desc"

		const startOfToday = new Date()
		startOfToday.setHours(0, 0, 0, 0)

		const where = {
			user_id: userId,
			...(includePast
				? {}
				: { appointment_date: { gte: startOfToday } }),
		}

		return await withDentist(userId, async (db) => {
			const [schedules, total] = await Promise.all([
				db.schedules.findMany({
					where,
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
								start_time: true,
								end_time: true,
							},
						},
					},
				}),
				db.schedules.count({ where }),
			])

			return NextResponse.json({
				data: schedules.map(schedule => ({
					id: Number(schedule.id),
					place_id: Number(schedule.place_id),
					place_name: schedule.places.name,
					place_branch: schedule.places.branch,
					place_start_time: schedule.places.start_time.toISOString(),
					place_end_time: schedule.places.end_time.toISOString(),
					appointment_date: schedule.appointment_date.toISOString(),
					df_guarantee_amount: Number(schedule.df_guarantee_amount),
					df_percent: Number(schedule.df_percent),
					remark: schedule.remark || "",
					created_at: schedule.created_at.toISOString(),
				})),
				total,
				allIds: schedules.map(schedule => Number(schedule.id)),
			})
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

export async function POST(request: NextRequest) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const body = await request.json()
		const { appointment_date, place_id, df_guarantee_amount, df_percent, remark } = body
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const newSchedule = await db.schedules.create({
				data: {
					user_id: userId,
					appointment_date: new Date(appointment_date),
					place_id: BigInt(place_id),
					df_guarantee_amount,
					df_percent,
					remark: remark || null,
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

			const appointmentDate = new Date(appointment_date).toLocaleDateString("th-TH", {
				year: "numeric",
				month: "long",
				day: "numeric",
			})

			await sendNotificationToUser(userId, {
				title: "สร้างตารางนัดหมายสำเร็จ",
				body: `นัดหมายที่ ${newSchedule.places.name} - ${newSchedule.places.branch} วันที่ ${appointmentDate}`,
				icon: "/logo-192x192.png",
				data: {
					url: "/schedules",
					scheduleId: Number(newSchedule.id),
				},
			}).catch((error) => {
				console.error("Failed to send notification:", error)
			})

			return NextResponse.json({
				id: Number(newSchedule.id),
				message: "Schedule created successfully",
			}, { status: 201 })
		})
	}
	catch (error) {
		console.error("Error creating schedule:", error)
		return NextResponse.json(
			{ error: "Failed to create schedule" },
			{ status: 500 },
		)
	}
}
