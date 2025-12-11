import type { NextRequest } from "next/server"

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { MasterSelectProps } from "@/types/global"

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const excludeScheduleId = searchParams.get("excludeScheduleId")

		// Get all schedules
		const schedules = await prisma.schedules.findMany({
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

		// Get all schedule IDs that are already used in works table
		const usedScheduleIds = await prisma.works.findMany({
			select: {
				schedule_id: true,
			},
		})

		// Convert BigInt to number for comparison
		const usedScheduleIdSet = new Set(
			usedScheduleIds.map(work => Number(work.schedule_id)),
		)

		// Filter out schedules that are already used in works
		// But include the schedule if it matches the excludeScheduleId (for editing)
		const availableSchedules = schedules.filter((schedule: any) => {
			const scheduleId = Number(schedule.id)
			const isExcluded = excludeScheduleId && scheduleId === Number(excludeScheduleId)
			return !usedScheduleIdSet.has(scheduleId) || isExcluded
		})

		return NextResponse.json(availableSchedules.map((schedule: any) => ({
			value: Number(schedule.id),
			label: `${schedule.places.name} - ${schedule.places.branch} (${new Date(schedule.appointment_date).toLocaleDateString("th-TH")})`,
		})) as MasterSelectProps[])
	}
	catch (error) {
		console.error("Error fetching schedules:", error)
		return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 })
	}
}
