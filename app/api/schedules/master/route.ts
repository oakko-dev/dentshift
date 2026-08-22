import type { NextRequest } from "next/server"

import { NextResponse } from "next/server"
import { requireDentist } from "@/lib/api/require-dentist"
import { withDentist } from "@/lib/db/with-dentist"
import type { MasterSelectProps } from "@/types/global"

export async function GET(request: NextRequest) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const searchParams = request.nextUrl.searchParams
		const excludeScheduleId = searchParams.get("excludeScheduleId")
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const schedules = await db.schedules.findMany({
				where: { user_id: userId },
				orderBy: {
					appointment_date: "asc",
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

			const usedScheduleIds = await db.works.findMany({
				where: { user_id: userId },
				select: {
					schedule_id: true,
				},
			})

			const usedScheduleIdSet = new Set(
				usedScheduleIds.map(work => Number(work.schedule_id)),
			)

			const availableSchedules = schedules.filter((schedule) => {
				const scheduleId = Number(schedule.id)
				const isExcluded = excludeScheduleId && scheduleId === Number(excludeScheduleId)
				return !usedScheduleIdSet.has(scheduleId) || isExcluded
			})

			return NextResponse.json(availableSchedules.map(schedule => ({
				value: Number(schedule.id),
				label: `${schedule.places.name} - ${schedule.places.branch} (${new Date(schedule.appointment_date).toLocaleDateString("th-TH")})`,
			})) as MasterSelectProps[])
		})
	}
	catch (error) {
		console.error("Error fetching schedules:", error)
		return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 })
	}
}
