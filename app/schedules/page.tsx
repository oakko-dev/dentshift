"use client"

import { Icon } from "@iconify/react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

import Modal from "@/components/ui/modal"
import { ModalStateProps } from "@/types/global"
import ScheduleFormModal from "./schedule-form-modal"
import SchedulesList from "./schedules-list"

export default function SchedulesPage() {
	const [modalOpen, setModalOpen] = useState<ModalStateProps>({ id: null, state: false })

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">จัดการนัดหมายการทำงาน</h1>
				<Button onClick={() => { setModalOpen({ id: null, state: true }) }}>
					<Icon icon="lucide:plus" />
					เพิ่มนัดหมาย
				</Button>
			</div>

			<SchedulesList onEdit={(id) => { setModalOpen({ id, state: true }) }} />

			<Modal
				open={modalOpen.state}
				header={modalOpen.id ? "แก้ไขนัดหมายทำงาน" : "เพิ่มนัดหมายทำงาน"}
				size="md"
				onClose={() => setModalOpen({ id: null, state: false })}
			>
				<ScheduleFormModal
					scheduleId={modalOpen.id}
					onClose={() => setModalOpen({ id: null, state: false })}
				/>
			</Modal>

		</div>
	)
}
