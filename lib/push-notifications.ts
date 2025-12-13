import webPush from "web-push"
import prisma from "@/lib/prisma"

// Initialize VAPID details
webPush.setVapidDetails(
	process.env.VAPID_SUBJECT!,
	process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
	process.env.VAPID_PRIVATE_KEY!,
)

export interface NotificationPayload {
	title: string
	body: string
	icon?: string
	badge?: string
	data?: any
}

/**
 * Send push notification to a specific user
 */
export async function sendNotificationToUser(
	userId: string,
	payload: NotificationPayload,
) {
	try {
		// Get all subscriptions for the user
		const subscriptions = await prisma.subscriptions.findMany({
			where: { user_id: userId },
		})

		if (subscriptions.length === 0) {
			console.log(`No subscriptions found for user: ${userId}`)
			return { success: false, message: "No subscriptions found" }
		}

		// Send notification to all user's subscriptions
		const results = await Promise.allSettled(
			subscriptions.map(async (sub) => {
				const pushSubscription = {
					endpoint: sub.endpoint,
					keys: {
						p256dh: sub.p256dh,
						auth: sub.auth,
					},
				}

				try {
					await webPush.sendNotification(
						pushSubscription,
						JSON.stringify(payload),
					)
					return { success: true, endpoint: sub.endpoint }
				}
				catch (error: any) {
					// If subscription is invalid (410 Gone), delete it
					if (error.statusCode === 410) {
						await prisma.subscriptions.delete({
							where: { id: sub.id },
						})
						console.log(`Deleted invalid subscription: ${sub.id}`)
					}
					throw error
				}
			}),
		)

		const successful = results.filter(r => r.status === "fulfilled").length
		const failed = results.filter(r => r.status === "rejected").length

		return {
			success: true,
			message: `Sent ${successful} notifications, ${failed} failed`,
			successful,
			failed,
		}
	}
	catch (error) {
		console.error("Error sending notification to user:", error)
		return { success: false, message: "Failed to send notifications" }
	}
}

/**
 * Send push notification to multiple users
 */
export async function sendNotificationToUsers(
	userIds: string[],
	payload: NotificationPayload,
) {
	const results = await Promise.allSettled(
		userIds.map(userId => sendNotificationToUser(userId, payload)),
	)

	const successful = results.filter(r => r.status === "fulfilled").length
	const failed = results.filter(r => r.status === "rejected").length

	return {
		success: true,
		message: `Notified ${successful} users, ${failed} failed`,
		successful,
		failed,
	}
}

/**
 * Send push notification to all users
 */
export async function sendNotificationToAllUsers(payload: NotificationPayload) {
	try {
		// Get all unique user IDs with subscriptions
		const users = await prisma.subscriptions.findMany({
			select: { user_id: true },
			distinct: ["user_id"],
		})

		const userIds = users.map(u => u.user_id)

		if (userIds.length === 0) {
			return { success: false, message: "No users with subscriptions found" }
		}

		return await sendNotificationToUsers(userIds, payload)
	}
	catch (error) {
		console.error("Error sending notification to all users:", error)
		return { success: false, message: "Failed to send notifications" }
	}
}

