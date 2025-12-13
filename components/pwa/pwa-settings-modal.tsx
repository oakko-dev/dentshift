// components/pwa/pwa-settings-modal.tsx
"use client"

import { Icon } from "@iconify/react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet"
import { authClient } from "@/lib/auth-client"

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
	if (typeof window === "undefined") {
		throw new TypeError("window is not available")
	}
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
	const rawData = window.atob(base64)
	const outputArray = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}

interface PWASettingsModalProps {
	isOpen: boolean
	onClose: () => void
}

export function PWASettingsModal({ isOpen, onClose }: PWASettingsModalProps) {
	const [subscription, setSubscription] = useState<PushSubscription | null>(null)
	const [isPWA, setIsPWA] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isMounted, setIsMounted] = useState(false)
	const [supportsServiceWorker, setSupportsServiceWorker] = useState(false)
	const [supportsPushManager, setSupportsPushManager] = useState(false)
	const [isLineLinked, setIsLineLinked] = useState(false)
	const [isCheckingLine, setIsCheckingLine] = useState(false)

	// Check if LINE is linked
	const checkLineAccount = useCallback(async () => {
		try {
			setIsCheckingLine(true)
			const response = await fetch("/api/accounts")
			if (response.ok) {
				const data = await response.json()
				setIsLineLinked(data.isLineLinked)
			}
		}
		catch (error) {
			console.error("Error checking LINE account:", error)
		}
		finally {
			setIsCheckingLine(false)
		}
	}, [])

	useEffect(() => {
		setIsMounted(true)

		// Check if running as PWA
		const checkPWA = () => {
			if (typeof window === "undefined")
				return
			const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches
			const isIOSPWA = (window.navigator as any).standalone === true
			setIsPWA(isInStandaloneMode || isIOSPWA)
		}

		// Check browser support
		if (typeof window !== "undefined" && typeof navigator !== "undefined") {
			setSupportsServiceWorker("serviceWorker" in navigator)
			setSupportsPushManager("PushManager" in window)
		}

		checkPWA()

		// Check existing subscription
		if (typeof window !== "undefined" && typeof navigator !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
			navigator.serviceWorker.ready.then((registration) => {
				registration.pushManager.getSubscription().then((sub) => {
					setSubscription(sub)
				})
			})
		}

		checkLineAccount()
	}, [checkLineAccount])

	// Refresh LINE status when modal opens
	useEffect(() => {
		if (isOpen) {
			checkLineAccount()
		}
	}, [isOpen, checkLineAccount])

	const subscribeToPush = async () => {
		try {
			setIsLoading(true)
			const registration = await navigator.serviceWorker.ready
			const sub = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
			})

			setSubscription(sub)

			// Send subscription to backend
			await fetch("/api/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(sub),
			})

			console.log("Successfully subscribed to push notifications")
		}
		catch (error) {
			console.error("Error subscribing to push notifications:", error)
		}
		finally {
			setIsLoading(false)
		}
	}

	const unsubscribeFromPush = async () => {
		try {
			setIsLoading(true)
			if (subscription) {
				// Unsubscribe from push manager
				await subscription.unsubscribe()

				// Remove subscription from database
				await fetch("/api/subscribe", {
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						endpoint: subscription.endpoint,
					}),
				})

				setSubscription(null)
				console.log("Successfully unsubscribed from push notifications")
			}
		}
		catch (error) {
			console.error("Error unsubscribing from push notifications:", error)
		}
		finally {
			setIsLoading(false)
		}
	}

	const sendTestNotification = async () => {
		if (!subscription)
			return

		try {
			setIsLoading(true)
			await fetch("/api/send-notification", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					subscription,
					message: `ทดสอบการแจ้งเตือน: ${new Date().toLocaleTimeString("th-TH")}`,
				}),
			})
			console.log("Test notification sent")
		}
		catch (error) {
			console.error("Error sending test notification:", error)
		}
		finally {
			setIsLoading(false)
		}
	}

	const linkLineAccount = async () => {
		try {
			setIsLoading(true)
			await authClient.linkSocial({
				provider: "line",
				callbackURL: window.location.pathname, // Redirect back to current page after linking
			})
			// After redirect, the component will re-mount and check the status again
		}
		catch (error) {
			console.error("Error linking LINE account:", error)
		}
		finally {
			setIsLoading(false)
		}
	}

	return (
		<Sheet open={isOpen} onOpenChange={onClose}>
			<SheetContent side="right" className="w-full sm:max-w-md">
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						<Icon icon="material-symbols:settings" className="size-5" />
						ตั้งค่า PWA
					</SheetTitle>
					<SheetDescription>
						จัดการการตั้งค่าแอปพลิเคชันและการแจ้งเตือน
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-6">
					{/* PWA Status */}
					<div className="rounded-lg border p-4">
						<div className="mb-2 flex items-center gap-2">
							<Icon
								icon={isPWA ? "material-symbols:check-circle" : "material-symbols:info"}
								className={`size-5 ${isPWA ? "text-green-600" : "text-yellow-600"}`}
							/>
							<h3 className="font-semibold">สถานะ PWA</h3>
						</div>
						<p className="text-muted-foreground text-sm">
							{isPWA
								? "✓ กำลังใช้งานในโหมด PWA"
								: "ℹ️ กำลังใช้งานผ่านเบราว์เซอร์"}
						</p>
					</div>

					{/* Push Notifications */}
					<div className="rounded-lg border p-4">
						<div className="mb-4 flex items-center gap-2">
							<Icon icon="material-symbols:notifications" className="size-5" />
							<h3 className="font-semibold">การแจ้งเตือนแบบพุช</h3>
						</div>

						{!isMounted || !(supportsServiceWorker && supportsPushManager)
							? (
									<p className="text-muted-foreground text-sm">
										เบราว์เซอร์ของคุณไม่รองรับการแจ้งเตือนแบบพุช
									</p>
								)
							: (
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<div className={`size-2 rounded-full ${subscription ? "bg-green-600" : "bg-gray-400"}`} />
												<span className="text-sm">
													{subscription ? "เปิดใช้งานแล้ว" : "ปิดใช้งาน"}
												</span>
											</div>
										</div>

										{subscription
											? (
													<div className="space-y-2">
														<Button
															onClick={unsubscribeFromPush}
															variant="outline"
															disabled={isLoading}
															className="w-full"
														>
															{isLoading
																? (
																		<Icon icon="eos-icons:loading" className="mr-2 size-4" />
																	)
																: (
																		<Icon icon="material-symbols:notifications-off" className="mr-2 size-4" />
																	)}
															ปิดการแจ้งเตือน
														</Button>
														<Button
															onClick={sendTestNotification}
															variant="secondary"
															disabled={isLoading}
															className="w-full"
														>
															{isLoading
																? (
																		<Icon icon="eos-icons:loading" className="mr-2 size-4" />
																	)
																: (
																		<Icon icon="material-symbols:send" className="mr-2 size-4" />
																	)}
															ส่งการแจ้งเตือนทดสอบ
														</Button>
													</div>
												)
											: (
													<Button
														onClick={subscribeToPush}
														disabled={isLoading}
														className="w-full"
													>
														{isLoading
															? (
																	<Icon icon="eos-icons:loading" className="mr-2 size-4" />
																)
															: (
																	<Icon icon="material-symbols:notifications-active" className="mr-2 size-4" />
																)}
														เปิดการแจ้งเตือน
													</Button>
												)}
									</div>
								)}
					</div>

					{/* LINE Account */}
					<div className="rounded-lg border p-4">
						<div className="mb-4 flex items-center gap-2">
							<Icon icon="simple-icons:line" className="size-5" />
							<h3 className="font-semibold">บัญชี LINE</h3>
						</div>

						{isCheckingLine
							? (
									<p className="text-muted-foreground text-sm">กำลังตรวจสอบ...</p>
								)
							: (
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												{isLineLinked
													? (
															<Icon icon="material-symbols:check-circle" className="size-5 text-green-600" />
														)
													: (
															<Icon icon="material-symbols:radio-button-unchecked" className="size-5 text-gray-400" />
														)}
												<span className="text-sm">
													{isLineLinked ? "เชื่อมต่อแล้ว" : "ยังไม่ได้เชื่อมต่อ"}
												</span>
											</div>
										</div>

										{!isLineLinked && (
											<Button
												onClick={linkLineAccount}
												disabled={isLoading}
												className="w-full"
											>
												{isLoading
													? (
															<Icon icon="eos-icons:loading" className="mr-2 size-4" />
														)
													: (
															<Icon icon="simple-icons:line" className="mr-2 size-4" />
														)}
												เชื่อมต่อบัญชี LINE
											</Button>
										)}
									</div>
								)}
					</div>

					{/* App Info */}
					<div className="rounded-lg border p-4">
						<div className="mb-2 flex items-center gap-2">
							<Icon icon="material-symbols:info" className="size-5" />
							<h3 className="font-semibold">ข้อมูลแอป</h3>
						</div>
						<div className="text-muted-foreground space-y-1 text-sm">
							<p>เวอร์ชัน: 1.0.0</p>
							<p>
								Service Worker :
								{" "}
								{isMounted && supportsServiceWorker ? "รองรับ" : "ไม่รองรับ"}
							</p>
							<p>
								Push API :
								{" "}
								{isMounted && supportsPushManager ? "รองรับ" : "ไม่รองรับ"}
							</p>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	)
}
