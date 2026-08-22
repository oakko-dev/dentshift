import { NextRequest, NextResponse } from "next/server"
import { requireDentist } from "@/lib/api/require-dentist"
import { withDentist } from "@/lib/db/with-dentist"

export async function GET(request: NextRequest) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const searchParams = request.nextUrl.searchParams
		const yearParam = searchParams.get("year")
		const monthParam = searchParams.get("month")
		const userId = authResult.session.user.id

		const year = yearParam ? Number.parseInt(yearParam) : new Date().getFullYear()
		const month = monthParam ? Number.parseInt(monthParam) : new Date().getMonth()

		const startDate = new Date(Date.UTC(year, month, 1))
		const endDate = new Date(Date.UTC(year, month + 1, 1))

		const scheduleWhere = {
			user_id: userId,
			appointment_date: {
				gte: startDate,
				lt: endDate,
			},
		}

		return await withDentist(userId, async (db) => {
			const [scheduleCount, dfGuaranteeAmount, waitingDepositCount, placeCount] = await Promise.all([
				db.schedules.count({ where: scheduleWhere }),
				db.schedules.aggregate({
					where: scheduleWhere,
					_sum: {
						df_guarantee_amount: true,
					},
				}),
				db.works.count({
					where: {
						user_id: userId,
						deposit_date: null,
						schedules: {
							appointment_date: {
								gte: startDate,
								lt: endDate,
							},
						},
					},
				}),
				db.schedules.groupBy({
					by: ["place_id"],
					_count: true,
					where: scheduleWhere,
				}),
			])

			return NextResponse.json({
				scheduleCount,
				dfGuaranteeAmount: dfGuaranteeAmount._sum.df_guarantee_amount || 0,
				waitingDepositCount,
				placeCount: placeCount.length || 0,
			})
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
