import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
	try {
		// Get last 6 months of data
		const currentDate = new Date()
		const sixMonthsAgo = new Date()
		sixMonthsAgo.setMonth(currentDate.getMonth() - 5)
		sixMonthsAgo.setDate(1)
		sixMonthsAgo.setHours(0, 0, 0, 0)

		// Thai month abbreviations
		const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]

		// Initialize data for last 6 months
		const chartData = []
		for (let i = 5; i >= 0; i--) {
			// Use day 1 so month arithmetic never overflows (e.g. Mar 31 − 1 month must not become Mar 2).
			const date = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth() - i,
				1,
			)
			const monthIndex = date.getMonth()
			const year = date.getFullYear()

			// Get start and end of month in UTC
			const startDate = new Date(Date.UTC(year, monthIndex, 1))
			const endDate = new Date(Date.UTC(year, monthIndex + 1, 1))

			// Query works for this month
			// Income: sum of deposit_amount where deposit_date is not null
			// Expense: sum of df_amount (down payment/fee)
			const [incomeData, expenseData] = await Promise.all([
				prisma.works.aggregate({
					where: {
						schedules: {
							appointment_date: {
								gte: startDate,
								lt: endDate,
							},
						},
					},
					_sum: {
						deposit_amount: true,
					},
				}),
				prisma.works.aggregate({
					where: {
						schedules: {
							appointment_date: {
								gte: startDate,
								lt: endDate,
							},
						},
					},
					_sum: {
						df_amount: true,
					},
				}),
			])

			chartData.push({
				month: thaiMonths[monthIndex],
				income: Number(incomeData._sum.deposit_amount || 0),
				expense: Number(expenseData._sum.df_amount || 0),
			})
		}

		return NextResponse.json(chartData)
	}
	catch (error) {
		console.error("Error fetching chart data:", error)
		return NextResponse.json(
			{ error: "Failed to fetch chart data" },
			{ status: 500 },
		)
	}
}
