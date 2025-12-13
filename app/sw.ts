import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
// src/app/sw.ts
import { defaultCache } from "@serwist/next/worker"
import { Serwist } from "serwist"

declare global {
	interface WorkerGlobalScope extends SerwistGlobalConfig {
		__SW_MANIFEST: (PrecacheEntry | string)[] | undefined
	}
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: defaultCache,
})

// 1. Initialize PWA Caching
serwist.addEventListeners()

// 2. Add Push Notification Listener
self.addEventListener("push", (event) => {
	const data = event.data?.json() ?? { title: "New Alert", body: "You have a new message!" }

	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: "/icon-192.png", // Ensure this exists in /public
			data: { url: data.url || "/" },
		}),
	)
})

// 3. Handle Notification Click
self.addEventListener("notificationclick", (event) => {
	event.notification.close()
	event.waitUntil(
		self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
			if (clientList.length > 0) {
				return clientList[0].focus()
			}
			return self.clients.openWindow(event.notification.data.url)
		}),
	)
})
