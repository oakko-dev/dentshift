import type { IconifyIcon } from "@iconify/react"

export interface SidebarMenu {
	name: string
	icon: IconifyIcon | string | null
	menu: SidebarMenuItem[]
}

export interface SidebarMenuItem {
	title: string
	url: string
	permission?: string
	icon: IconifyIcon | string | null
}

export interface SidebarMenuActive {
	places: boolean
	banks: boolean
	schedules: boolean
	works: boolean
}

export const HomeMenu: SidebarMenu = {
	name: "",
	icon: null,
	menu: [
		{
			title: "Dashboard",
			url: "/",
			icon: "material-symbols:dashboard-outline",
		},
		{
			title: "สถานที่ทำงาน",
			url: "/places",
			icon: "material-symbols:location-on-outline",
		},
		{
			title: "บัญชีธนาคาร",
			url: "/banks",
			icon: "ic:outline-credit-card",
		},
		{
			title: "นัดหมายวันทำงาน",
			url: "/schedules",
			icon: "material-symbols:calendar-today-outline-rounded",
		},
		{
			title: "บันทึกการทำงาน",
			url: "/works",
			icon: "mdi:file-document-outline",
		},
	],
}
