import { Icon } from "@iconify/react"

import { Button } from "@/components/ui/button"

import PlacesList from "./places-list"

export default function PlacesPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">จัดการสถานที่ทำงาน</h1>
				<Button>
					<Icon icon="lucide:plus" />
					เพิ่มสถานที่ทำงาน
				</Button>
			</div>

			<PlacesList />
		</div>
	)
}
