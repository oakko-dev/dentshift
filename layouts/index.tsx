"use client"

import type { JSX } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { createPortal } from "react-dom"

import { AppSidebar } from "@/components/common/app-sidebar"
import Header from "@/components/common/header"
import Loading from "@/components/common/loading"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { useLoadingStore } from "@/providers/loading-store-provider"

export interface LayoutsProps {
	children: JSX.Element | React.ReactNode
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
		},
	},
})

export default function Layouts({ children }: LayoutsProps) {
	const pathname = usePathname()
	const isLoading = useLoadingStore(state => state.isLoading)

	const setLoadingPortal = (): JSX.Element =>
		isLoading ? createPortal(<Loading fullscreen />, document.getElementById("portal")!) : <></>

	switch (pathname) {
		case "/error":
			return children
		case "/login":
		case "/forgot-password":
		case "/reset-password":
			return (
				<>
					<QueryClientProvider client={queryClient}>
						{children}
						{setLoadingPortal()}
					</QueryClientProvider>
				</>
			)
		default:
			return (
				<>
					<QueryClientProvider client={queryClient}>
						<SidebarProvider>
							<Header />
							<AppSidebar />
							<SidebarInset>
								<Toaster />
								<Suspense fallback={<Loading fullscreen />}>
									<main className="w-full pt-[64px]">
										<div className="bg-sub-background px-4 py-4">
											{children}
											{setLoadingPortal()}
										</div>
									</main>
								</Suspense>
							</SidebarInset>
						</SidebarProvider>
					</QueryClientProvider>
				</>
			)
	}
}
