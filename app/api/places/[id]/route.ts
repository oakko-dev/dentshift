import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { TaxType } from "@/types/places"

// GET single place
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const placeId = Number(id)

		const place = await prisma.places.findUnique({
			where: {
				id: BigInt(placeId),
			},
		})

		if (!place) {
			return NextResponse.json(
				{ error: "Place not found" },
				{ status: 404 },
			)
		}

		return NextResponse.json({
			id: Number(place.id),
			name: place.name,
			branch: place.branch,
			location: place.location || "",
			tag: place.tag || "",
			start_time: place.start_time.toISOString(),
			end_time: place.end_time.toISOString(),
			tax_type: (place.tax_type === "F" ? TaxType.FULL : TaxType.VAT),
			remark: place.remark || "",
		})
	}
	catch (error) {
		console.error("Error fetching place:", error)
		return NextResponse.json(
			{ error: "Failed to fetch place" },
			{ status: 500 },
		)
	}
}

// PUT update place
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const placeId = Number(id)
		const body = await request.json()

		const { name, branch, location, tag, start_time, end_time, tax_type, remark } = body

		const updatedPlace = await prisma.places.update({
			where: {
				id: BigInt(placeId),
			},
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
			id: Number(updatedPlace.id),
			message: "Place updated successfully",
		})
	}
	catch (error) {
		console.error("Error updating place:", error)
		return NextResponse.json(
			{ error: "Failed to update place" },
			{ status: 500 },
		)
	}
}

// DELETE place
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		const placeId = Number(id)

		await prisma.places.delete({
			where: {
				id: BigInt(placeId),
			},
		})

		return NextResponse.json({
			message: "Place deleted successfully",
		})
	}
	catch (error) {
		console.error("Error deleting place:", error)
		return NextResponse.json(
			{ error: "Failed to delete place" },
			{ status: 500 },
		)
	}
}

