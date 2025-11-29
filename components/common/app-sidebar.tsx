import type { SidebarMenuActive } from "@/utils/sidebar-menu"
import { Icon } from "@iconify/react"
import Link from "next/link"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HomeMenu } from "@/utils/sidebar-menu"

export function AppSidebar() {
	const pathname = usePathname()

	const [openMenus, setOpenMenus] = useState<SidebarMenuActive>({
		places: false,
		banks: false,
		schedules: false,
		works: false,
		payments: false,
	})

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
			payments:
				checkIfMenuActive("/payments"),
		})
	}, [pathname, checkIfMenuActive])

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
		</Sidebar>
	)
}
