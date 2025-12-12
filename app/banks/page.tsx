"use client"

import { Icon } from "@iconify/react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { ModalStateProps } from "@/types/global"

import BankFormModal from "./bank-form-modal"
import BanksList from "./banks-list"

export default function BanksPage() {
	const [modalOpen, setModalOpen] = useState<ModalStateProps>({ id: null, state: false })
	const [refreshTrigger, setRefreshTrigger] = useState(0)

	const handleSuccess = () => {
		// Trigger refresh of the list
		setRefreshTrigger(prev => prev + 1)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">จัดการบัญชีธนาคาร</h1>
				<Button onClick={() => { setModalOpen({ id: null, state: true }) }}>
					<Icon icon="lucide:plus" />
					เพิ่มบัญชีธนาคาร
				</Button>
			</div>

			<BanksList key={refreshTrigger} onEdit={(id) => { setModalOpen({ id, state: true }) }} />

			<Modal
				open={modalOpen.state}
				header={modalOpen.id ? "แก้ไขบัญชีธนาคาร" : "เพิ่มบัญชีธนาคาร"}
				size="md"
				onClose={() => setModalOpen({ id: null, state: false })}
			>
				<BankFormModal
					bankId={modalOpen.id}
					onClose={() => setModalOpen({ id: null, state: false })}
					onSuccess={handleSuccess}
				/>
			</Modal>
		</div>
	)
}
