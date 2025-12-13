import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
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

		const subscription = await request.json()

		// Extract the subscription data
		const { endpoint, keys } = subscription
		const { p256dh, auth: authKey } = keys

		// Check if subscription already exists for this user
		const existingSubscription = await prisma.subscriptions.findUnique({
			where: { endpoint },
		})

		if (existingSubscription) {
			// Update if it exists but belongs to a different user
			if (existingSubscription.user_id !== session.user.id) {
				await prisma.subscriptions.update({
					where: { endpoint },
					data: {
						user_id: session.user.id,
						p256dh,
						auth: authKey,
					},
				})
			}
			return NextResponse.json({
				message: "Subscription already exists",
				subscription: existingSubscription,
			})
		}

		// Create new subscription
		const newSubscription = await prisma.subscriptions.create({
			data: {
				user_id: session.user.id,
				endpoint,
				p256dh,
				auth: authKey,
			},
		})

		console.log("New Subscription saved:", newSubscription.id)

		return NextResponse.json({
			message: "Subscription saved successfully!",
			subscription: newSubscription,
		})
	}
	catch (error) {
		console.error("Error saving subscription:", error)
		return NextResponse.json(
			{ error: "Failed to save subscription" },
			{ status: 500 },
		)
	}
}

export async function DELETE(request: Request) {
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

		const { endpoint } = await request.json()

		// Delete the subscription
		const deletedSubscription = await prisma.subscriptions.deleteMany({
			where: {
				endpoint,
				user_id: session.user.id,
			},
		})

		if (deletedSubscription.count === 0) {
			return NextResponse.json(
				{ error: "Subscription not found" },
				{ status: 404 },
			)
		}

		console.log("Subscription deleted for user:", session.user.id)

		return NextResponse.json({
			message: "Subscription deleted successfully!",
		})
	}
	catch (error) {
		console.error("Error deleting subscription:", error)
		return NextResponse.json(
			{ error: "Failed to delete subscription" },
			{ status: 500 },
		)
	}
}
