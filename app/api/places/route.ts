import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { TaxType } from "@/types/places"

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const page = Number.parseInt(searchParams.get("page") || "0")
		const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")

		const [places, total] = await Promise.all([
			prisma.places.findMany({
				skip: page * pageSize,
				take: pageSize,
				orderBy: {
					id: "desc",
				},
			}),
			prisma.places.count(),
		])

		return NextResponse.json({
			data: places.map(place => ({
				id: Number(place.id),
				name: place.name,
				branch: place.branch,
				location: place.location || "",
				tag: place.tag || "",
				start_time: place.start_time.toISOString(),
				end_time: place.end_time.toISOString(),
				tax_type: (place.tax_type === "F" ? TaxType.FULL : TaxType.VAT),
			})),
			total,
			allIds: places.map(place => Number(place.id)),
		})
	}
	catch (error) {
		console.error("Error fetching places:", error)
		return NextResponse.json(
			{ error: "Failed to fetch places" },
			{ status: 500 },
		)
	}
}
