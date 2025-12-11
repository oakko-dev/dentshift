"use client"

import { Icon } from "@iconify/react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

import Modal from "@/components/ui/modal"
import { ModalStateProps } from "@/types/global"
import DepositFormModal from "./deposit-form-modal"
import WorkFormModal from "./work-form-modal"
import WorksList from "./works-list"

export default function WorksPage() {
	const [modalOpen, setModalOpen] = useState<ModalStateProps>({ id: null, state: false })
	const [depositModalOpen, setDepositModalOpen] = useState<ModalStateProps>({ id: null, state: false })

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">บันทึกการทำงาน (Timesheet)</h1>
				<Button onClick={() => { setModalOpen({ id: null, state: true }) }}>
					<Icon icon="lucide:plus" />
					เพิ่มบันทึก
				</Button>
			</div>

			<WorksList
				onEdit={(id) => { setModalOpen({ id, state: true }) }}
				onDeposit={(id) => { setDepositModalOpen({ id, state: true }) }}
			/>

			<Modal
				open={modalOpen.state}
				header={modalOpen.id ? "แก้ไขบันทึกการทำงาน" : "เพิ่มบันทึกการทำงาน"}
				size="md"
				onClose={() => setModalOpen({ id: null, state: false })}
			>
				<WorkFormModal
					workId={modalOpen.id}
					onClose={() => setModalOpen({ id: null, state: false })}
				/>
			</Modal>

			<Modal
				open={depositModalOpen.state}
				header="บันทึกการโอนเงิน"
				size="sm"
				onClose={() => setDepositModalOpen({ id: null, state: false })}
			>
				<DepositFormModal
					workId={depositModalOpen.id ?? 0}
					onClose={() => setDepositModalOpen({ id: null, state: false })}
				/>
			</Modal>

		</div>
	)
}
