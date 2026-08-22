import { NextRequest, NextResponse } from "next/server"
import { requireDentist } from "@/lib/api/require-dentist"
import { withDentist } from "@/lib/db/with-dentist"

interface ChartRow {
	month: Date
	income: number | string
	expense: number | string
}

export async function GET(request: NextRequest) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const userId = authResult.session.user.id
		const currentDate = new Date()
		const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
		const rangeStart = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() - 5, 1))
		const rangeEnd = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

		return await withDentist(userId, async (db) => {
			const rows = await db.$queryRaw<ChartRow[]>`
				SELECT
					date_trunc('month', s.appointment_date) AS month,
					COALESCE(SUM(w.deposit_amount), 0) AS income,
					COALESCE(SUM(w.df_amount), 0) AS expense
				FROM works w
				INNER JOIN schedules s ON s.id = w.schedule_id
				WHERE w.user_id = ${userId}
					AND s.appointment_date >= ${rangeStart}
					AND s.appointment_date < ${rangeEnd}
				GROUP BY 1
				ORDER BY 1
			`

			const totalsByMonth = new Map<string, { income: number, expense: number }>()
			for (const row of rows) {
				const monthDate = new Date(row.month)
				const key = `${monthDate.getUTCFullYear()}-${monthDate.getUTCMonth()}`
				totalsByMonth.set(key, {
					income: Number(row.income || 0),
					expense: Number(row.expense || 0),
				})
			}

			const chartData = []
			for (let i = 5; i >= 0; i--) {
				const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
				const monthIndex = date.getMonth()
				const year = date.getFullYear()
				const totals = totalsByMonth.get(`${year}-${monthIndex}`)

				chartData.push({
					month: thaiMonths[monthIndex],
					income: totals?.income ?? 0,
					expense: totals?.expense ?? 0,
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
