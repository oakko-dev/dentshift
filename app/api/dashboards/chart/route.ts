import { NextRequest, NextResponse } from "next/server"
import { requireDentist } from "@/lib/api/require-dentist"
import { withDentist } from "@/lib/db/with-dentist"

export async function GET(request: NextRequest) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const userId = authResult.session.user.id
		const currentDate = new Date()
		const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]

		return await withDentist(userId, async (db) => {
			const chartData = []

			for (let i = 5; i >= 0; i--) {
				const date = new Date(
					currentDate.getFullYear(),
					currentDate.getMonth() - i,
					1,
				)
				const monthIndex = date.getMonth()
				const year = date.getFullYear()

				const startDate = new Date(Date.UTC(year, monthIndex, 1))
				const endDate = new Date(Date.UTC(year, monthIndex + 1, 1))

				const workWhere = {
					user_id: userId,
					schedules: {
						appointment_date: {
							gte: startDate,
							lt: endDate,
						},
					},
				}

				const [incomeData, expenseData] = await Promise.all([
					db.works.aggregate({
						where: workWhere,
						_sum: {
							deposit_amount: true,
						},
					}),
					db.works.aggregate({
						where: workWhere,
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
		})
	}
	catch (error) {
		console.error("Error fetching chart data:", error)
		return NextResponse.json(
			{ error: "Failed to fetch chart data" },
			{ status: 500 },
		)
	}
}
