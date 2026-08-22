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
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const banks = await db.banks.findMany({
				where: { user_id: userId },
				orderBy: {
					account_name: "asc",
				},
			})
			return NextResponse.json(banks.map(bank => ({
				value: Number(bank.id),
				label: `${bank.account_name} - ${bank.account_number}`,
			})) as MasterSelectProps[])
		})
	}
	catch (error) {
		console.error("Error fetching banks:", error)
		return NextResponse.json({ error: "Failed to fetch banks" }, { status: 500 })
	}
}
