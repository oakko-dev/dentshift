"use client"

import { Icon } from "@iconify/react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { ModalStateProps } from "@/types/global"

import PlaceFormModal from "./place-form-modal"
import PlacesList from "./places-list"

export default function PlacesPage() {
	const [modalOpen, setModalOpen] = useState<ModalStateProps>({ id: null, state: false })
	const [refreshTrigger, setRefreshTrigger] = useState(0)

	const handleSuccess = () => {
		// Trigger refresh of the list
		setRefreshTrigger(prev => prev + 1)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">จัดการสถานที่ทำงาน</h1>
				<Button onClick={() => { setModalOpen({ id: null, state: true }) }}>
					<Icon icon="lucide:plus" />
					เพิ่มสถานที่ทำงาน
				</Button>
			</div>

			<PlacesList key={refreshTrigger} onEdit={(id) => { setModalOpen({ id, state: true }) }} />

			<Modal
				open={modalOpen.state}
				header={modalOpen.id ? "แก้ไขสถานที่ทำงาน" : "เพิ่มสถานที่ทำงาน"}
				size="md"
				onClose={() => setModalOpen({ id: null, state: false })}
			>
				<PlaceFormModal
					placeId={modalOpen.id}
					onClose={() => setModalOpen({ id: null, state: false })}
					onSuccess={handleSuccess}
				/>
			</Modal>
		</div>
	)
}
