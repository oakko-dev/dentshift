// src/components/PushNotificationManager.tsx
"use client"

import { useEffect, useState } from "react"

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
	const rawData = window.atob(base64)
	const outputArray = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}

export default function PushNotificationManager() {
	const [subscription, setSubscription] = useState<PushSubscription | null>(null)

	useEffect(() => {
		if ("serviceWorker" in navigator) {
			// Register Service Worker
			navigator.serviceWorker.register("/sw.js").then((registration) => {
				console.log("SW Registered:", registration)
			})
		}
	}, [])

	const subscribeToPush = async () => {
		const registration = await navigator.serviceWorker.ready
		const sub = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
		})

		console.log(sub)

		setSubscription(sub)

		// Send subscription to backend
		// await fetch("/api/subscribe", {
		// 	method: "POST",
		// 	headers: { "Content-Type": "application/json" },
		// 	body: JSON.stringify(sub),
		// })
	}

	const sendTestNotification = async () => {
		if (!subscription)
			return

		await fetch("/api/send-notification", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				subscription,
				message: `Current Time: ${new Date().toLocaleTimeString()}`,
			}),
		})
	}

	return (
		<div className="rounded border bg-gray-100 p-4 dark:bg-gray-800">
			<h3 className="mb-2 text-lg font-bold">Push Notifications</h3>
			<button
				type="button"
				onClick={subscribeToPush}
				className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			>
				Enable Notifications
			</button>
			<div className="space-y-2">
				<p className="font-medium text-green-600">✓ Notifications Enabled</p>
				<button
					type="button"
					onClick={sendTestNotification}
					className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
				>
					Send Test Push
				</button>
			</div>
		</div>
	)
}
