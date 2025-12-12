"use client"

import { Icon } from "@iconify/react"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import Loading from "@/components/common/loading"
import { swal } from "@/components/common/sweetalert"
import { Button } from "@/components/ui/button"
import { useDeleteWork, useInfiniteWorkLists } from "@/lib/react-query/works"
import { useLoadingStore } from "@/providers/loading-store-provider"
import { convertDateToThai, getPageSize } from "@/utils/helpers"

interface WorksListProps {
	onEdit?: (id: number) => void
	onDeposit?: (id: number) => void
}

export default function WorksList({ onEdit, onDeposit }: WorksListProps) {
	const pageSize = getPageSize()
	const updateLoading = useLoadingStore(state => state.updateLoading)
	const [sortBy, setSortBy] = useState<string>("appointment_date")
	const [sortOrder, setSortOrder] = useState<string>("desc")
	const [showCompleted, setShowCompleted] = useState<boolean>(true)
	const observerTarget = useRef<HTMLDivElement>(null)

	const {
		data,
		isLoading,
		isError,
		error,
		isFetching,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteWorkLists({
		pageSize,
		sortBy,
		sortOrder,
	})

	const deleteWorkMutation = useDeleteWork()

	// Flatten all pages into a single array
	const allWorks = data?.pages.flatMap(page => page.data) ?? []

	// Intersection Observer for infinite scroll
	useEffect(() => {
		const currentObserverTarget = observerTarget.current
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage()
				}
			},
			{ threshold: 0.1 },
		)

		if (currentObserverTarget) {
			observer.observe(currentObserverTarget)
		}

		return () => {
			if (currentObserverTarget) {
				observer.unobserve(currentObserverTarget)
			}
		}
	}, [fetchNextPage, hasNextPage, isFetchingNextPage])

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

	const handleSortChange = (field: string) => {
		if (sortBy === field) {
			// Toggle sort order if clicking the same field
			setSortOrder(prev => prev === "desc" ? "asc" : "desc")
		}
		else {
			// Set new field with default desc order
			setSortBy(field)
			setSortOrder("asc")
		}
	}

	const handleDelete = async (id: number, name: string, date: string) => {
		swal.fire({
			title: "คุณต้องการลบบันทึกการทำงานนี้หรือไม่?",
			html: `
                <p>สถานที่: ${name}</p>
                <p>วันที่คาดการณ์: ${date}</p>
            `,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "ตกลง",
			cancelButtonText: "ยกเลิก",
		}).then(async (result) => {
			if (result.isConfirmed) {
				updateLoading(true)
				deleteWorkMutation.mutate(id, {
					onSuccess: () => {
						updateLoading(false)
						toast.success("ลบบันทึกการทำงานสำเร็จ")
					},
					onError: (error) => {
						updateLoading(false)
						swal.fire({
							title: "เกิดข้อผิดพลาด",
							text: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบข้อมูล",
							icon: "error",
						})
					},
				})
			}
		})
	}

	return (
		<div className="space-y-4">
			{/* Sorting and Filter Bar */}
			<div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
				<div className="flex items-center gap-3">
					<span className="text-muted-foreground text-sm font-medium">เรียงตาม:</span>
					<div className="flex gap-2">
						<Button
							variant={sortBy === "forecast_payment_date" ? "default" : "outline"}
							size="sm"
							onClick={() => handleSortChange("forecast_payment_date")}
							className="gap-1"
						>
							วันที่คาดการณ์
							{sortBy === "forecast_payment_date" && (
								<Icon
									icon={sortOrder === "desc" ? "lucide:arrow-down" : "lucide:arrow-up"}
									className="size-3"
								/>
							)}
						</Button>
						<Button
							variant={sortBy === "appointment_date" ? "default" : "outline"}
							size="sm"
							onClick={() => handleSortChange("appointment_date")}
							className="gap-1"
						>
							วันที่ทำงาน
							{sortBy === "appointment_date" && (
								<Icon
									icon={sortOrder === "desc" ? "lucide:arrow-down" : "lucide:arrow-up"}
									className="size-3"
								/>
							)}
						</Button>
					</div>
				</div>

				<Button
					variant={showCompleted ? "default" : "outline"}
					size="sm"
					onClick={() => setShowCompleted(prev => !prev)}
					className="gap-2"
				>
					<Icon
						icon={showCompleted ? "lucide:eye" : "lucide:eye-off"}
						className="size-4"
					/>
					{showCompleted ? "ซ่อนที่โอนแล้ว" : "แสดงที่โอนแล้ว"}
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{allWorks
					.filter((work) => {
						if (!showCompleted) {
							return true
						}
						return !work.deposit_date
					})
					.map((work) => {
						const isCompleted = !!work.deposit_date
						const forecastDate = new Date(work.forecast_payment_date)
						const today = new Date()
						today.setHours(0, 0, 0, 0)
						forecastDate.setHours(0, 0, 0, 0)
						const isOverdue = forecastDate < today && !isCompleted

						return (
							<div
								key={work.id}
								className={`bg-card relative rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
									isCompleted ? "opacity-60 grayscale" : ""
								} ${isOverdue ? "border-destructive" : ""}`}
							>
								{/* Status indicator */}
								{isCompleted && (
									<div className="absolute top-2 right-2 rounded-md bg-green-500/90 px-2 py-1 text-xs font-medium text-white">
										โอนแล้ว
									</div>
								)}
								{isOverdue && (
									<div className="bg-destructive/90 absolute top-2 right-2 rounded-md px-2 py-1 text-xs font-medium text-white">
										เกินกำหนด
									</div>
								)}

								{/* Header with schedule info and actions */}
								<div className="mb-3 flex items-start justify-between">
									<div>
										<div className={`mb-1 flex items-center gap-1 text-sm font-medium ${isOverdue ? "text-destructive" : isCompleted ? "text-muted-foreground" : "text-primary"}`}>
											<Icon icon="lucide:calendar" className="size-4" />
											{convertDateToThai(work.schedule_appointment_date!, "dd MMMM yyyy")}
										</div>
										<div className="text-muted-foreground flex items-center gap-1 text-sm">
											<Icon icon="lucide:map-pin" className="size-3" />
											<span className="text-foreground font-medium">{work.schedule_place_name || "ไม่ระบุสถานที่"}</span>
										</div>
										{work.schedule_place_branch && (
											<div className="flex items-center gap-1">
												<Icon icon="lucide:map-pin" className="invisible size-3" />
												<span className="text-muted-foreground flex items-center gap-1 text-sm">
													{work.schedule_place_branch}
												</span>
											</div>
										)}
									</div>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="text-green-600 hover:bg-green-50 hover:text-green-700"
											onClick={() => onDeposit?.(work.id)}
											title="บันทึกการโอนเงิน"
										>
											<Icon icon="lucide:banknote" className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="text-primary"
											onClick={() => onEdit?.(work.id)}
											title="แก้ไข"
										>
											<Icon icon="lucide:pencil" className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="text-destructive"
											onClick={() => handleDelete(work.id, `${work.schedule_place_name} - ${work.schedule_place_branch}`, convertDateToThai(work.forecast_payment_date, "d MMMM yyyy"))}
											title="ลบ"
										>
											<Icon icon="lucide:trash-2" className="size-4" />
										</Button>
									</div>
								</div>

								{/* Amount Information */}
								<div className="mb-3 space-y-2">
									<div className="bg-muted/50 rounded-lg p-3">
										<div className="mb-2 flex items-center justify-between">
											<span className="text-muted-foreground text-sm">ยอดรวมทั้งหมด</span>
											<span className="text-foreground text-lg font-semibold">
												{work.total_amount.toLocaleString()}
												{" "}
												บาท
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">ยอด DF ทั้งหมด</span>
											<span className="text-primary text-lg font-semibold">
												{work.df_amount.toLocaleString()}
												{" "}
												บาท
											</span>
										</div>
									</div>
								</div>

								{/* Payment Information */}
								<div className="mb-3 space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground text-sm">วันที่คาดการณ์:</span>
										<span className={`font-medium ${isOverdue ? "text-destructive" : "text-foreground"}`}>
											{convertDateToThai(work.forecast_payment_date, "d MMM yyyy")}
										</span>
									</div>
									{work.deposit_date && (
										<>
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground text-sm">วันที่โอน:</span>
												<span className="font-medium text-green-600">
													{convertDateToThai(work.deposit_date, "d MMM yyyy")}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground text-sm">ยอดที่โอน:</span>
												<span className="font-semibold text-green-600">
													{work.deposit_amount?.toLocaleString()}
													{" "}
													บาท
												</span>
											</div>
										</>
									)}
								</div>

								{/* Bank Information */}
								<div className="bg-muted/30 mb-3 rounded-lg p-2">
									<div className="text-muted-foreground flex items-center gap-2 text-xs">
										<Icon icon="lucide:building-2" className="size-3" />
										<span className="font-medium">{work.bank_account_name}</span>
										-
										<span>{work.bank_account_number}</span>
									</div>
								</div>

								{/* Remark */}
								{work.remark && (
									<div className="text-muted-foreground mb-3 text-sm">
										<div className="mb-1 font-medium">หมายเหตุ:</div>
										<div className="text-foreground">{work.remark}</div>
									</div>
								)}

								{/* Footer */}
								<div className="text-muted-foreground border-t pt-3 text-xs">
									สร้างเมื่อ:
									{" "}
									{convertDateToThai(work.created_at, "dd MMM yyyy HH:mm")}
								</div>
							</div>
						)
					})}
			</div>

			{/* Loading indicator for infinite scroll */}
			<div ref={observerTarget} className="flex justify-center py-4">
				{isFetchingNextPage && (
					<div className="text-muted-foreground flex items-center gap-2 text-sm">
						<Loading />
					</div>
				)}
				{!hasNextPage && allWorks.length > 0 && (
					<div className="text-muted-foreground text-sm">
						แสดงครบทั้งหมดแล้ว
					</div>
				)}
			</div>
		</div>
	)
}
