"use client"

import { Icon } from "@iconify/react"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import Loading from "@/components/common/loading"
import { swal } from "@/components/common/sweetalert"
import { Button } from "@/components/ui/button"
import { useDeleteSchedule, useInfiniteScheduleLists } from "@/lib/react-query/schedules"
import { useLoadingStore } from "@/providers/loading-store-provider"
import { convertDateToThai, getPageSize } from "@/utils/helpers"

interface SchedulesListProps {
	onEdit?: (id: number) => void
}

export default function SchedulesList({ onEdit }: SchedulesListProps) {
	const pageSize = getPageSize()
	const updateLoading = useLoadingStore(state => state.updateLoading)
	const [sortBy, setSortBy] = useState<string>("appointment_date")
	const [sortOrder, setSortOrder] = useState<string>("asc")
	const [showPastAppointments, setShowPastAppointments] = useState<boolean>(false)
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
	} = useInfiniteScheduleLists({
		pageSize,
		sortBy,
		sortOrder,
	})

	const deleteScheduleMutation = useDeleteSchedule()

	// Flatten all pages into a single array
	const allSchedules = data?.pages.flatMap(page => page.data) ?? []

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
			setSortOrder("desc")
		}
	}

	const handleDelete = async (id: number, name: string, date: string) => {
		swal.fire({
			title: "คุณต้องการลบนัดหมายนี้หรือไม่?",
			html: `
                <p>นัดหมาย: ${name}</p>
                <p>วันที่: ${date}</p>
            `,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "ตกลง",
			cancelButtonText: "ยกเลิก",
		}).then(async (result) => {
			if (result.isConfirmed) {
				updateLoading(true)
				deleteScheduleMutation.mutate(id, {
					onSuccess: () => {
						updateLoading(false)
						toast.success("ลบนัดหมายสำเร็จ")
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
							variant={sortBy === "created_at" ? "default" : "outline"}
							size="sm"
							onClick={() => handleSortChange("created_at")}
							className="gap-1"
						>
							วันที่สร้าง
							{sortBy === "created_at" && (
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
							วันที่นัด
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
					variant={showPastAppointments ? "outline" : "default"}
					size="sm"
					onClick={() => setShowPastAppointments(prev => !prev)}
					className="gap-2"
				>
					<Icon
						icon={showPastAppointments ? "lucide:eye" : "lucide:eye-off"}
						className="size-4"
					/>
					{showPastAppointments ? "ซ่อนนัดที่ผ่านแล้ว" : "แสดงนัดที่ผ่านแล้ว"}
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{allSchedules
					.filter((schedule) => {
						if (showPastAppointments) {
							return true
						}
						const appointmentDate = new Date(schedule.appointment_date)
						const today = new Date()
						today.setHours(0, 0, 0, 0)
						appointmentDate.setHours(0, 0, 0, 0)
						return appointmentDate >= today
					})
					.map((schedule) => {
						const appointmentDate = new Date(schedule.appointment_date)
						const today = new Date()
						today.setHours(0, 0, 0, 0)
						appointmentDate.setHours(0, 0, 0, 0)
						const isPastDate = appointmentDate < today

						return (
							<div
								key={schedule.id}
								className={`bg-card relative rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
									isPastDate ? "opacity-50 grayscale" : ""
								}`}
							>
								{/* Past date indicator */}
								{isPastDate && (
									<div className="bg-destructive/90 absolute top-2 right-2 rounded-md px-2 py-1 text-xs font-medium text-white">
										ผ่านมาแล้ว
									</div>
								)}

								{/* Header with date and actions */}
								<div className="mb-3 flex items-start justify-between">
									<div>
										<div className={`mb-1 flex items-center gap-1 text-sm font-medium ${isPastDate ? "text-muted-foreground" : "text-primary"}`}>
											<Icon icon="lucide:calendar" className="size-4" />
											{convertDateToThai(schedule.appointment_date, "dd MMMM yyyy")}
										</div>
										<div className="text-muted-foreground flex items-center gap-1 text-sm">
											<Icon icon="lucide:map-pin" className="size-3" />
											<span className="text-foreground font-medium">{schedule.place_name || "ไม่ระบุสถานที่"}</span>
											{schedule.place_branch && (
												<span>
													{" "}
													-
													{" "}
													{schedule.place_branch}
												</span>
											)}
										</div>
									</div>
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="icon"
											className="text-primary"
											onClick={() => onEdit?.(schedule.id)}
										>
											<Icon icon="lucide:pencil" className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="text-destructive"
											onClick={() => handleDelete(schedule.id, `${schedule.place_name} - ${schedule.place_branch}`, convertDateToThai(schedule.appointment_date, "d MMMM yyyy"))}
										>
											<Icon icon="lucide:trash-2" className="size-4" />
										</Button>
									</div>
								</div>

								{/* DF Information */}
								<div className="mb-3 space-y-2">
									<div className="bg-muted/50 rounded-lg p-3">
										<div className="mb-2 flex items-center justify-between">
											<span className="text-muted-foreground text-sm">DF Guarantee</span>
											<span className="text-foreground text-lg font-semibold">
												{schedule.df_guarantee_amount.toLocaleString()}
												{" "}
												บาท
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">DF Percent</span>
											<span className="text-primary text-lg font-semibold">
												{schedule.df_percent}
												%
											</span>
										</div>
									</div>
								</div>

								{/* Remark */}
								{schedule.remark && (
									<div className="text-muted-foreground mb-3 text-sm">
										<div className="mb-1 font-medium">หมายเหตุ:</div>
										<div className="text-foreground">{schedule.remark}</div>
									</div>
								)}

								{/* Footer */}
								<div className="text-muted-foreground border-t pt-3 text-xs">
									สร้างเมื่อ:
									{" "}
									{convertDateToThai(schedule.created_at, "dd MMM yyyy HH:mm")}
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
				{!hasNextPage && allSchedules.length > 0 && (
					<div className="text-muted-foreground text-sm">
						แสดงครบทั้งหมดแล้ว
					</div>
				)}
			</div>
		</div>
	)
}
