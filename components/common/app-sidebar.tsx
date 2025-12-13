import type { SidebarMenuActive } from "@/utils/sidebar-menu"
import { Icon } from "@iconify/react"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { PWASettingsModal } from "@/components/pwa/pwa-settings-modal"
import { Button } from "@/components/ui/button"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import { signOut, useSession } from "@/lib/auth-client"
import { HomeMenu } from "@/utils/sidebar-menu"

export function AppSidebar() {
	const pathname = usePathname()
	const router = useRouter()

	const [openMenus, setOpenMenus] = useState<SidebarMenuActive>({
		places: false,
		banks: false,
		schedules: false,
		works: false,
	})

	const [isPWASettingsOpen, setIsPWASettingsOpen] = useState(false)

	const checkIfMenuActive = useCallback(
		(basePath: string, excludePaths: string[] = []) => {
			// Handle exact match for root path
			if (basePath === "/") {
				return pathname === "/"
			}

			// Check if pathname starts with basePath
			if (!pathname.startsWith(basePath)) {
				return false
			}

			// Check for excluded paths
			for (const excludePath of excludePaths) {
				if (pathname.startsWith(excludePath)) {
					return false
				}
			}

			// Additional check: ensure we're matching a complete path segment
			// This prevents "/requisition" from matching "/requisition-approve"
			const pathAfterBase = pathname.slice(basePath.length)
			if (pathAfterBase.length > 0 && !pathAfterBase.startsWith("/") && !pathAfterBase.startsWith("?")) {
				return false
			}

			return true
		},
		[pathname],
	)

	useEffect(() => {
		setOpenMenus({
			places:
				checkIfMenuActive("/place"),
			banks:
				checkIfMenuActive("/banks"),
			schedules:
				checkIfMenuActive("/schedules"),
			works:
				checkIfMenuActive("/works"),
		})
	}, [pathname, checkIfMenuActive])

	const {
		data: session,
		isPending, // loading state
		error, // error object
	} = useSession()

	const handleLogout = async () => {
		await signOut()
		router.push("/login")
	}

	return (
		<Sidebar variant="sidebar">
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{HomeMenu.menu.map(item => (
								<SidebarMenuItem
									key={item.title}
								>
									<SidebarMenuButton
										asChild
										isActive={
											pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url))
										}
									>
										<Link href={item.url}>
											{item.icon && <Icon icon={item.icon} />}
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					{isPending
						? (
								<SidebarMenuItem>
									<SidebarMenuButton disabled>
										<Icon icon="eos-icons:loading" />
										<span>Loading...</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)
						: session?.user
							? (
									<>
										<SidebarMenuItem>
											<div className="flex items-center justify-between gap-2 px-2 py-2 text-sm">
												<div className="flex items-center gap-2 overflow-hidden">
													<div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full">
														{
															session.user.image
																? <Image src={session.user.image} className="rounded-full" alt="User Image" width={32} height={32} />
																: (
																		<div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full">
																			{session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || "U"}
																		</div>
																	)
														}
													</div>
													<div className="flex flex-col overflow-hidden">
														<span className="truncate font-medium">
															{
																session.user.providerId != "credential" ? session.user.name : `${session.user.firstname} ${session.user.lastname}` || "User"
															}
														</span>
														<span className="text-muted-foreground truncate text-xs">
															{session.user.email}
														</span>
													</div>
												</div>
												<Button
													variant="ghost"
													size="icon"
													className="size-8 shrink-0"
													onClick={() => setIsPWASettingsOpen(true)}
													title="ตั้งค่า PWA"
												>
													<Icon icon="material-symbols:settings" className="size-5" />
												</Button>
											</div>
										</SidebarMenuItem>
										<SidebarMenuItem>
											<SidebarMenuButton onClick={handleLogout} className="cursor-pointer">
												<Icon icon="material-symbols:logout" />
												<span>ออกจากระบบ</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									</>
								)
							: (
									<SidebarMenuItem>
										<SidebarMenuButton onClick={handleLogout} className="cursor-pointer">
											<Icon icon="material-symbols:logout" />
											<span>{session?.session.id}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)}
				</SidebarMenu>
			</SidebarFooter>
			<PWASettingsModal
				isOpen={isPWASettingsOpen}
				onClose={() => setIsPWASettingsOpen(false)}
			/>
		</Sidebar>
	)
}
