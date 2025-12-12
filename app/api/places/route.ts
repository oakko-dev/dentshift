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
				remark: place.remark || "",
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

// POST create new place
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { name, branch, location, tag, start_time, end_time, tax_type, remark } = body

		const newPlace = await prisma.places.create({
			data: {
				name,
				branch,
				location: location || null,
				tag: tag || null,
				start_time: new Date(start_time),
				end_time: new Date(end_time),
				tax_type: tax_type || null,
				remark: remark || null,
			},
		})

		return NextResponse.json({
			id: Number(newPlace.id),
			message: "Place created successfully",
		}, { status: 201 })
	}
	catch (error) {
		console.error("Error creating place:", error)
		return NextResponse.json(
			{ error: "Failed to create place" },
			{ status: 500 },
		)
	}
}
