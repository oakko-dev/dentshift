"use client"

import { Icon } from "@iconify/react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

interface ListPaginationProps {
	page: number
	pageSize: number
	total: number
	onPageChange: (page: number) => void
	disabled?: boolean
}

function getVisiblePages(page: number, pageCount: number): Array<number | "ellipsis"> {
	if (pageCount <= 7) {
		return Array.from({ length: pageCount }, (_, i) => i)
	}

	const items: Array<number | "ellipsis"> = [0]
	const start = Math.max(1, page - 1)
	const end = Math.min(pageCount - 2, page + 1)

	if (start > 1) {
		items.push("ellipsis")
	}

	for (let i = start; i <= end; i++) {
		items.push(i)
	}

	if (end < pageCount - 2) {
		items.push("ellipsis")
	}

	items.push(pageCount - 1)
	return items
}

export default function ListPagination({
	page,
	pageSize,
	total,
	onPageChange,
	disabled = false,
}: ListPaginationProps) {
	const pageCount = Math.max(1, Math.ceil(total / pageSize))
	const lastPage = pageCount - 1

	useEffect(() => {
		if (total === 0) {
			if (page !== 0) {
				onPageChange(0)
			}
			return
		}
		if (page > lastPage) {
			onPageChange(lastPage)
		}
	}, [lastPage, onPageChange, page, total])

	if (total === 0) {
		return null
	}

	const pages = getVisiblePages(Math.min(page, lastPage), pageCount)

	return (
		<nav className="flex flex-wrap items-center justify-center gap-1 py-2" aria-label="Pagination">
			<Button
				variant="outline"
				size="sm"
				disabled={disabled || page <= 0}
				onClick={() => onPageChange(page - 1)}
				aria-label="Previous page"
			>
				<Icon icon="lucide:chevron-left" className="size-4" />
			</Button>
			{pages.map((item, index) => {
				if (item === "ellipsis") {
					return (
						<span
							key={`ellipsis-${index}`}
							className="text-muted-foreground px-2 text-sm"
						>
							…
						</span>
					)
				}

				return (
					<Button
						key={item}
						variant={item === page ? "default" : "outline"}
						size="sm"
						disabled={disabled}
						onClick={() => onPageChange(item)}
						aria-current={item === page ? "page" : undefined}
					>
						{item + 1}
					</Button>
				)
			})}
			<Button
				variant="outline"
				size="sm"
				disabled={disabled || page >= lastPage}
				onClick={() => onPageChange(page + 1)}
				aria-label="Next page"
			>
				<Icon icon="lucide:chevron-right" className="size-4" />
			</Button>
		</nav>
	)
}
