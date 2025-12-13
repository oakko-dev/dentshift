import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		})

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			)
		}

		// Get all accounts for the user
		const accounts = await prisma.accounts.findMany({
			where: {
				userId: session.user.id,
			},
			select: {
				providerId: true,
			},
		})

		// Check if LINE is linked
		const isLineLinked = accounts.some((account) => account.providerId === "line")

		return NextResponse.json({
			accounts,
			isLineLinked,
		})
	}
	catch (error) {
		console.error("Error fetching accounts:", error)
		return NextResponse.json(
			{ error: "Failed to fetch accounts" },
			{ status: 500 },
		)
	}
}

