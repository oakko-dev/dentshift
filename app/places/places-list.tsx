"use client"

import { Icon } from "@iconify/react"
import Link from "next/link"

import { useState } from "react"
import ListPagination from "@/components/common/list-pagination"
import Loading from "@/components/common/loading"
import { swal } from "@/components/common/sweetalert"
import { Button } from "@/components/ui/button"
import { useDeletePlace, usePlaceLists } from "@/lib/react-query/places"
import { useLoadingStore } from "@/providers/loading-store-provider"
import { getPageSize } from "@/utils/helpers"

interface PlacesListProps {
	onEdit: (id: number) => void
}

export default function PlacesList({ onEdit }: PlacesListProps) {
	const [page, setPage] = useState(0)
	const pageSize = getPageSize()

	const updateLoading = useLoadingStore(state => state.updateLoading)
	const deletePlace = useDeletePlace()

	const { data, isLoading, isError, error, isFetching } = usePlaceLists({
		page,
		pageSize,
	})

	const places = data?.data ?? []
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

	const handleDelete = async (id: number, name: string) => {
		const result = await swal.fire({
			title: "ยืนยันการลบ",
			text: `คุณต้องการลบสถานที่ "${name}" ใช่หรือไม่?`,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "ลบ",
			cancelButtonText: "ยกเลิก",
		})

		if (result.isConfirmed) {
			updateLoading(true)
			try {
				await deletePlace.mutateAsync(id)
				if (places.length === 1 && page > 0) {
					setPage(page - 1)
				}
				updateLoading(false)
				swal.fire({
					title: "ลบสำเร็จ",
					text: "ลบข้อมูลสถานที่เรียบร้อยแล้ว",
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
				{places.map(place => (
					<div
						key={place.id}
						className="bg-card relative rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md"
					>
						{/* Header with name and actions */}
						<div className="mb-3 flex items-start justify-between">
							<div>
								<h3 className="text-foreground text-lg font-semibold">
									{place.name || "ไม่ระบุชื่อ"}
								</h3>
								<p className="text-muted-foreground text-sm">{place.branch || "ไม่ระบุสาขา"}</p>
							</div>
							<div className="flex gap-2">
								<Button
									variant="ghost"
									size="icon"
									className="text-primary"
									onClick={() => onEdit(place.id)}
								>
									<Icon icon="lucide:pencil" className="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="text-destructive"
									onClick={() => handleDelete(place.id, place.name)}
								>
									<Icon icon="lucide:trash-2" className="size-4" />
								</Button>
							</div>
						</div>

						{/* Tags */}
						<div className="mb-3 flex flex-wrap gap-2">
							{place.tag && place.tag.split(",").map((tag: string) => (
								<span
									key={`${place.id}-${tag.trim()}`}
									className="bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-medium"
								>
									{tag.trim()}
								</span>
							))}
						</div>

						{/* Time info */}
						<div className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
							<Icon icon="lucide:clock" className="size-4" />
							<span>
								{place.start_time ? place.start_time.substring(11, 16) : "--:--"}
								{" - "}
								{place.end_time ? place.end_time.substring(11, 16) : "--:--"}
							</span>
						</div>

						{/* Location */}
						<div className="text-muted-foreground mb-3 flex items-start gap-1 text-sm">
							<Icon icon="lucide:map-pin" className="mt-0.5 size-4 shrink-0" />
							<Link href={`${place.location}`} target="_blank" className="text-primary font-medium">ดูแผนที่</Link>
						</div>

						{/* Footer with additional info */}
						<div className="text-muted-foreground border-t pt-3 text-sm">
							<div>
								การคิดเงิน:
								{" "}
								<span className="text-foreground font-medium">
									{place.tax_type === "F" ? "เต็มจำนวน" : "หัก ณ ที่จ่าย 3%"}
								</span>
							</div>
							{/* <div>
								วันที่ลงทะเบียน:
								{" "}
								<span className="text-foreground font-medium">12/3/5098</span>
							</div> */}
						</div>
					</div>
				))}
			</div>

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
