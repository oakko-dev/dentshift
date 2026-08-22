"use client"

import { Icon } from "@iconify/react"

import { useState } from "react"
import ListPagination from "@/components/common/list-pagination"
import Loading from "@/components/common/loading"
import { swal } from "@/components/common/sweetalert"
import { Button } from "@/components/ui/button"
import { useBankLists, useDeleteBank } from "@/lib/react-query/banks"
import { useLoadingStore } from "@/providers/loading-store-provider"
import { getPageSize } from "@/utils/helpers"

interface BanksListProps {
	onEdit: (id: number) => void
}

export default function BanksList({ onEdit }: BanksListProps) {
	const [page, setPage] = useState(0)
	const pageSize = getPageSize()

	const updateLoading = useLoadingStore(state => state.updateLoading)
	const deleteBank = useDeleteBank()

	const { data, isLoading, isError, error, isFetching } = useBankLists({
		page,
		pageSize,
	})

	const banks = data?.data ?? []
	const total = data?.total ?? 0

	if (isLoading) {
		return (
			<div className="flex items-center justify-center">
				<Loading />
			</div>
		)
	}
	if (isError) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-destructive">
					เกิดข้อผิดพลาด:
					{" "}
					{error?.message}
				</div>
			</div>
		)
	}

	const handleDelete = async (id: number, accountName: string) => {
		const result = await swal.fire({
			title: "ยืนยันการลบ",
			text: `คุณต้องการลบบัญชีธนาคาร "${accountName}" ใช่หรือไม่?`,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "ลบ",
			cancelButtonText: "ยกเลิก",
		})

		if (result.isConfirmed) {
			updateLoading(true)
			try {
				await deleteBank.mutateAsync(id)
				if (banks.length === 1 && page > 0) {
					setPage(page - 1)
				}
				updateLoading(false)
				swal.fire({
					title: "ลบสำเร็จ",
					text: "ลบข้อมูลบัญชีธนาคารเรียบร้อยแล้ว",
					icon: "success",
				})
			}
			catch (error: any) {
				updateLoading(false)
				swal.fire({
					title: "เกิดข้อผิดพลาด",
					text: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบข้อมูล",
					icon: "error",
				})
			}
		}
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{banks.map(bank => (
					<div
						key={bank.id}
						className="bg-card relative rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md"
					>
						{/* Header with actions */}
						<div className="mb-4 flex items-start justify-between">
							<div className="flex items-center gap-3">
								<div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
									<Icon icon="lucide:building-2" className="size-6" />
								</div>
								<div className="flex-1">
									<h3 className="text-foreground text-lg font-semibold">
										{bank.account_name || "ไม่ระบุชื่อบัญชี"}
									</h3>
								</div>
							</div>
							<div className="flex gap-2">
								<Button
									variant="ghost"
									size="icon"
									className="text-primary"
									onClick={() => onEdit(bank.id)}
								>
									<Icon icon="lucide:pencil" className="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="text-destructive"
									onClick={() => handleDelete(bank.id, bank.account_name)}
								>
									<Icon icon="lucide:trash-2" className="size-4" />
								</Button>
							</div>
						</div>

						{/* Account number */}
						<div className="border-border border-t pt-4">
							<div className="text-muted-foreground flex items-center gap-2 text-sm">
								<Icon icon="lucide:hash" className="size-4" />
								<span>เลขที่บัญชี:</span>
							</div>
							<div className="text-foreground mt-1 text-xl font-mono font-semibold">
								{bank.account_number || "ไม่ระบุ"}
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Empty state */}
			{banks.length === 0 && !isLoading && (
				<div className="flex flex-col items-center justify-center py-12">
					<Icon icon="lucide:building-2" className="text-muted-foreground mb-4 size-16" />
					<p className="text-muted-foreground text-lg">ยังไม่มีบัญชีธนาคาร</p>
					<p className="text-muted-foreground text-sm">เริ่มต้นด้วยการเพิ่มบัญชีธนาคารใหม่</p>
				</div>
			)}

			<ListPagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={setPage}
				disabled={isFetching}
			/>
		</div>
	)
}

