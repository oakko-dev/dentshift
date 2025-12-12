import _ from "lodash"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const yearParam = searchParams.get("year")
		const monthParam = searchParams.get("month")

	// Default to current year and month if not provided
	const year = yearParam ? Number.parseInt(yearParam) : new Date().getFullYear()
	const month = monthParam ? Number.parseInt(monthParam) : new Date().getMonth()

	// Create start and end dates for the selected month in UTC
	const startDate = new Date(Date.UTC(year, month, 1))
	const endDate = new Date(Date.UTC(year, month + 1, 1))

		// Query all schedules in the selected month
		// Query sum all df_guarantee_amount for the month
		// Query count of works waiting for deposit (deposit_date is null)
		// Query count all place that schedule on that month
		const [scheduleCount, dfGuaranteeAmount, waitingDepositCount, placeCount] = await Promise.all([
			prisma.schedules.count({
				where: {
					appointment_date: {
						gte: startDate,
						lt: endDate,
					},
				},
			}),
			prisma.schedules.aggregate({
				where: {
					appointment_date: {
						gte: startDate,
						lt: endDate,
					},
				},
				_sum: {
					df_guarantee_amount: true,
				},
			}),
			prisma.works.count({
				where: {
					deposit_date: null,
					schedules: {
						appointment_date: {
							gte: startDate,
							lt: endDate,
						},
					},
				},
			}),
			prisma.schedules.groupBy({
				by: ["place_id"],
				_count: true,
				where: {
					appointment_date: {
						gte: startDate,
						lt: endDate,
					},
				},
			}),
		])

		return NextResponse.json({
			scheduleCount,
			dfGuaranteeAmount: dfGuaranteeAmount._sum.df_guarantee_amount || 0,
			waitingDepositCount,
			placeCount: placeCount.length || 0,
		})
	}
	catch (error) {
		console.error("Error fetching dashboard data:", error)
		return NextResponse.json(
			{ error: "Failed to fetch dashboard data" },
			{ status: 500 },
		)
	}
}
