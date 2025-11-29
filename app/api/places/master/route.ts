import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { MasterSelectProps } from "@/types/global"

export async function GET() {
	try {
		const places = await prisma.places.findMany({
			orderBy: {
				name: "asc",
			},
		})
		return NextResponse.json(places.map((place: any) => ({
			value: Number(place.id),
			label: `${place.name}${place.branch ? ` - ${place.branch}` : ""}`,
		})) as MasterSelectProps[])
	}
	catch (error) {
		console.error("Error fetching places:", error)
		return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 })
	}
}
