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
			const places = await db.places.findMany({
				orderBy: {
					name: "asc",
				},
			})
			return NextResponse.json(places.map(place => ({
				value: Number(place.id),
				label: `${place.name}${place.branch ? ` - ${place.branch}` : ""}`,
			})) as MasterSelectProps[])
		})
	}
	catch (error) {
		console.error("Error fetching places:", error)
		return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 })
	}
}
