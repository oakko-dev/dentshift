"use client"

import Image from "next/image"
import { SidebarTrigger } from "../ui/sidebar"

function Header() {
	return (
		<>
			<header className="bg-background fixed top-0 z-15 flex w-full items-center justify-between px-4 py-4 shadow-sm">
				<div className="items-between flex justify-between lg:justify-start">
					<div className="flex items-center">
						<Image src="/logo-dentshift.png" width={50} height={50} alt="Dentshift Logo" priority unoptimized />
						<h1 className="text-primary-dark text-2xl font-bold">DentShift</h1>
					</div>
				</div>
				<SidebarTrigger />
			</header>
		</>
	)
}

export default Header
