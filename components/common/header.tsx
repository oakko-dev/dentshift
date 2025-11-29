"use client"

import { SidebarTrigger } from "../ui/sidebar"

function Header() {
	return (
		<>
			<header className="bg-background fixed top-0 z-15 flex w-full items-center justify-between px-4 py-4 shadow-sm">
				<div className="items-between flex justify-between lg:justify-start">
					<h1 className="text-primary text-2xl font-bold">ระบบจัดการทันตแพทย์</h1>
				</div>
				<SidebarTrigger />
			</header>
		</>
	)
}

export default Header
