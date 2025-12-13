import { NextResponse } from "next/server"
import webPush from "web-push"

webPush.setVapidDetails(
	process.env.VAPID_SUBJECT!,
	process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
	process.env.VAPID_PRIVATE_KEY!,
)

export async function POST(request: Request) {
	const { subscription, message } = await request.json()
	console.log(subscription)

	try {
		await webPush.sendNotification(
			subscription,
			JSON.stringify({ title: "Hello User", body: message }),
		)
		return NextResponse.json({ message: "Notification sent!" })
	}
	catch (error) {
		console.error("Error sending notification", error)
		return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
	}
}
