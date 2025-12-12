import type { ClassValue } from "clsx"
import clsx from "clsx"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import _ from "lodash"
import { twMerge } from "tailwind-merge"

export const getPageSize = (): number => Number.parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE ?? "10")

export const getPageSizeMini = (): number => Number.parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE_MINI ?? "5")

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function convertDateToThai(dateInput: Date | string, dateFormat: string = "dd MMMM yyyy", isBC: boolean = true) {
	if (!dateInput)
		return ""

	const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
	if (Number.isNaN(date.getTime()))
		return ""

	const formatDate = format(date, dateFormat, { locale: th })

	if (isBC) {
		const yearBE = date.getFullYear() + 543
		const formattedDate = formatDate.replace(/(\d{4})(?!.*\d{4})/, String(yearBE))
		return dateFormat == "dd MMM yyyy HH:mm" ? `${formattedDate} น.` : formattedDate
	}

	return formatDate
}

export function rowSelectionToArray(selection: Record<string, boolean>): number[] {
	return _.chain(selection)
		.pickBy(Boolean)
		.keys()
		.map(Number)
		.filter(n => !Number.isNaN(n))
		.value()
}