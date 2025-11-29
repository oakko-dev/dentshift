"use client"

import { Icon } from "@iconify/react"
import Link from "next/link"

import { useEffect, useRef, useState } from "react"
import Loading from "@/components/common/loading"
import { Button } from "@/components/ui/button"
import { usePlaceLists } from "@/lib/react-query/places"

export default function PlacesList() {
	const [page, setPage] = useState(0)
	const [pageSize] = useState(10)
	const [allPlaces, setAllPlaces] = useState<any[]>([])
	const observerTarget = useRef<HTMLDivElement>(null)

	const { data, isLoading, isError, error, isFetching } = usePlaceLists({
		page,
		pageSize,
	})

	// Accumulate data as we load more pages
	useEffect(() => {
		if (data?.data) {
			setAllPlaces((prev) => {
				// Avoid duplicates by checking if we already have this page's data
				const newIds = data.data.map(p => p.id)
				const existingIds = new Set(prev.map(p => p.id))
				const newItems = data.data.filter(p => !existingIds.has(p.id))
				return [...prev, ...newItems]
			})
		}
	}, [data])

	// Intersection Observer for infinite scroll
	useEffect(() => {
		const currentObserverTarget = observerTarget.current
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !isFetching && data?.data.length === pageSize) {
					setPage(prev => prev + 1)
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
	}, [isFetching, data?.data.length, pageSize])

	if (isLoading && page === 0) {
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

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{allPlaces.map(place => (
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
								<Button variant="ghost" size="icon" className="text-primary">
									<Icon icon="lucide:pencil" className="size-4" />
								</Button>
								<Button variant="ghost" size="icon" className="text-destructive">
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

			{/* Loading indicator for infinite scroll */}
			<div ref={observerTarget} className="flex justify-center py-4">
				{isFetching && (
					<div className="text-muted-foreground flex items-center gap-2 text-sm">
						{/* <Icon icon="lucide:loader-2" className="size-4 animate-spin" />
						กำลังโหลดเพิ่มเติม... */}
						<Loading />
					</div>
				)}
				{!isFetching && data?.data && data.data.length !== 0 && data.data.length < pageSize && (
					<div className="text-muted-foreground text-sm">
						แสดงครบทั้งหมดแล้ว
					</div>
				)}
			</div>
		</div>
	)
}
