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
	payments: boolean
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
		{
			title: "บันทึกเงินเข้า",
			url: "/payments",
			icon: "ph:currency-dollar",
		},
	],
}

// export const DrugManagementMenu: SidebarMenu = {
// 	name: "ข้อมูลยาและเวชภัณฑ์ที่มิใช่ยา",
// 	icon: Tablets,
// 	menu: [
// 		{
// 			title: "จัดการข้อมูลยา",
// 			url: "/drug",
// 			permission: "drug",
// 			icon: null,
// 		},
// 		{
// 			title: "จัดการข้อมูลเวชภัณฑ์ที่มิใช่ยา",
// 			url: "/medical-supply",
// 			permission: "drug",
// 			icon: null,
// 		},
// 		{
// 			title: "จัดการหมวดหมู่หลัก",
// 			url: "/category-main",
// 			permission: "drug",
// 			icon: null,
// 		},
// 		{
// 			title: "จัดการหมวดหมู่",
// 			url: "/category-two",
// 			permission: "drug",
// 			icon: null,
// 		},
// 		{
// 			title: "จัดการหมวดหมู่ย่อย",
// 			url: "/category-sub",
// 			permission: "drug",
// 			icon: null,
// 		},
// 	],
// };

// export const ProcurementManagementMenu: SidebarMenu = {
// 	name: "การจัดซื้อ",
// 	icon: ReceiptText,
// 	menu: [
// 		{
// 			title: "รายการคำขอจัดซื้อ",
// 			url: "/purchase-request",
// 			permission: "pr",
// 			icon: null,
// 		},
// 		{
// 			title: "รายการใบสั่งซื้อ (PO)",
// 			url: "/purchase-order",
// 			permission: "po",
// 			icon: null,
// 		},
// 		{
// 			title: "รายการรออนุมัติ",
// 			url: "/purchase-approve",
// 			permission: "approve",
// 			icon: null,
// 		},
// 	],
// };

// export const DrugWarehouseManagementMenu: SidebarMenu = {
// 	name: "การบริหารคลัง",
// 	icon: ArrowRightLeft,
// 	menu: [
// 		{
// 			title: "รายการรอรับ",
// 			url: "/receive",
// 			permission: "receive",
// 			icon: null,
// 		},
// 		{
// 			title: "โอนย้าย/รอเบิก",
// 			url: "/requisition",
// 			permission: "withdraw",
// 			icon: null,
// 		},
// 		{
// 			title: "รายการรออนุมัติเบิก",
// 			url: "/requisition-approve",
// 			permission: "withdrawApprove",
// 			icon: null,
// 		},
// 		{
// 			title: "ยาคงคลัง",
// 			url: "/drug-stock",
// 			permission: "drugstock",
// 			icon: null,
// 		},
// 		{
// 			title: "ตรวจสอบอายุยา",
// 			url: "/low-stock",
// 			permission: "lowstock",
// 			icon: null,
// 		},
// 		{
// 			title: "ยาหมดสต๊อก",
// 			url: "/out-stock",
// 			permission: "outstock",
// 			icon: null,
// 		},
// 		{
// 			title: "การเคลื่อนไหวของยา",
// 			url: "/stock-movement",
// 			permission: "stockmovement",
// 			icon: null,
// 		},
// 		{
// 			title: "รายการรอทำลาย",
// 			url: "/destroy",
// 			permission: "destroy",
// 			icon: null,
// 		},
// 	],
// };

// export const StorageManagementMenu: SidebarMenu = {
// 	name: "การจัดการคลัง",
// 	icon: Container,
// 	menu: [
// 		{
// 			title: "จัดการสถานที่จัดเก็บ",
// 			url: "/location",
// 			permission: "location",
// 			icon: null,
// 		},
// 		{
// 			title: "จัดการตำแหน่งที่จัดเก็บ",
// 			url: "/position",
// 			permission: "position",
// 			icon: null,
// 		},
// 	],
// };

// export const UserManagementMenu: SidebarMenu = {
// 	name: "บริหารข้อมูลผู้ใช้งาน",
// 	icon: Users2,
// 	menu: [
// 		{
// 			title: "จัดการกลุ่มสิทธิ์",
// 			url: "/permission",
// 			permission: "permission",
// 			icon: null,
// 		},
// 		{
// 			title: "จัดการผู้ใช้งาน",
// 			url: "/user",
// 			permission: "users",
// 			icon: null,
// 		},
// 		{
// 			title: "บันทึกการใช้งานผู้ใช้งาน",
// 			url: "/user-log",
// 			permission: "logs",
// 			icon: null,
// 		},
// 	],
// };

// export const DepartmentManagementMenu: SidebarMenu = {
// 	name: "บริหารข้อมูลหน่วยงาน",
// 	icon: Building2,
// 	menu: [
// 		{
// 			title: "กองสาธารณสุข",
// 			url: "/center",
// 			permission: "center",
// 			icon: null,
// 		},
// 		{
// 			title: "จัดการคลังย่อย",
// 			url: "/dispensary",
// 			permission: "dispensary",
// 			icon: null,
// 		},
// 	],
// };

// export const SupplierManagementMenu: SidebarMenu = {
// 	name: "บริหารข้อมูลผู้จำหน่าย",
// 	icon: Car,
// 	menu: [
// 		{
// 			title: "จัดการข้อมูลผู้จำหน่าย",
// 			url: "/supplier",
// 			permission: "supplier",
// 			icon: null,
// 		},
// 	],
// };
