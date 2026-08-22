import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { requireDentist } from "@/lib/api/require-dentist"
import { placeHasSchedules } from "@/lib/db/ownership"
import { withDentist } from "@/lib/db/with-dentist"
import { TaxType } from "@/types/places"

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const { id } = await params
		const placeId = BigInt(id)
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const place = await db.places.findUnique({
				where: { id: placeId },
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

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const { id } = await params
		const placeId = BigInt(id)
		const body = await request.json()
		const { name, branch, location, tag, start_time, end_time, tax_type, remark } = body
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const existing = await db.places.findUnique({
				where: { id: placeId },
				select: { id: true },
			})

			if (!existing) {
				return NextResponse.json(
					{ error: "Place not found" },
					{ status: 404 },
				)
			}

			const updatedPlace = await db.places.update({
				where: { id: placeId },
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

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const authResult = await requireDentist(request)
	if (authResult.error) {
		return authResult.error
	}

	try {
		const { id } = await params
		const placeId = BigInt(id)
		const userId = authResult.session.user.id

		return await withDentist(userId, async (db) => {
			const existing = await db.places.findUnique({
				where: { id: placeId },
				select: { id: true },
			})

			if (!existing) {
				return NextResponse.json(
					{ error: "Place not found" },
					{ status: 404 },
				)
			}

			if (await placeHasSchedules(placeId)) {
				return NextResponse.json(
					{ error: "Cannot delete place while schedules exist for it" },
					{ status: 409 },
				)
			}

			await db.places.delete({
				where: { id: placeId },
			})

			return NextResponse.json({
				message: "Place deleted successfully",
			})
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
