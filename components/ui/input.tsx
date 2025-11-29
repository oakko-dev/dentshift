import type { JSX } from "react"
import { Icon } from "@iconify/react"
import { useEffect, useState } from "react"

import { cn } from "@/utils/helpers"

type InputProps = React.ComponentProps<"input"> & {
	iconPosition?: "left" | "right"
	iconClick?: () => void
	icon?: JSX.Element
	isFile?: boolean
	thousandSeparator?: boolean
}

function Input({
	className,
	type,
	iconPosition,
	iconClick,
	icon,
	isFile = false,
	thousandSeparator = false,
	value,
	onChange,
	...props
}: InputProps) {
	const [toggleType, setToggleType] = useState(type)
	const [displayValue, setDisplayValue] = useState<string>("")

	// Format number with thousand separators
	const formatNumberWithCommas = (num: string): string => {
		// Remove existing commas and non-numeric characters except decimal point
		const cleanNum = num.replace(/[^\d.]/g, "")

		// Split by decimal point
		const parts = cleanNum.split(".")

		// Add commas to integer part
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")

		// Join back with decimal if it exists
		return parts.join(".")
	}

	// Remove commas for actual value
	const removeCommas = (num: string): string => {
		return num.replace(/,/g, "")
	}

	// Update display value when value prop changes
	useEffect(() => {
		if (thousandSeparator && value !== undefined) {
			const stringValue = String(value)
			if (!Number.isNaN(Number(removeCommas(stringValue))) && stringValue !== "") {
				setDisplayValue(formatNumberWithCommas(stringValue))
			}
			else {
				setDisplayValue(stringValue)
			}
		}
		else {
			setDisplayValue(String(value || ""))
		}
	}, [value, thousandSeparator])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value

		if (thousandSeparator) {
			// Only allow numbers, commas, and decimal points
			const cleanValue = inputValue.replace(/[^\d.,]/g, "")

			if (cleanValue === "" || !Number.isNaN(Number(removeCommas(cleanValue)))) {
				const formattedValue = cleanValue === "" ? "" : formatNumberWithCommas(cleanValue)
				setDisplayValue(formattedValue)

				// Create a new event with the clean numeric value (without commas)
				const cleanNumericValue = removeCommas(formattedValue)
				const syntheticEvent = {
					...e,
					target: {
						...e.target,
						value: cleanNumericValue,
					},
				}

				onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>)
			}
		}
		else {
			setDisplayValue(inputValue)
			onChange?.(e)
		}
	}

	return (
		<div className="relative">
			{iconPosition == "left" && (
				<div
					className={cn(
						"absolute inset-y-0 left-0 my-px ml-px flex items-center justify-center rounded-r-md p-4",
						iconClick ? "cursor-pointer" : "",
					)}
					onClick={iconClick}
				>
					{icon}
				</div>
			)}
			<input
				type={toggleType}
				data-slot="input"
				className={cn(
					"flex w-full min-w-0 rounded-sm border border-input bg-transparent px-4 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-secondary",
					"focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
					"aria-invalid:border-destructive aria-invalid:ring-destructive/20",
					iconPosition == "left" && icon ? "pl-12" : "",
					iconPosition == "right" && icon ? "pr-12" : "",
					type == "password" ? "pr-12" : "",
					className,
				)}
				value={thousandSeparator ? displayValue : value}
				onChange={handleChange}
				{...props}
			/>
			{type == "password" && (
				<div
					className={cn(
						"absolute inset-y-0 right-0 my-px ml-px flex cursor-pointer items-center justify-center rounded-r-md p-4",
					)}
					onClick={() => setToggleType(toggleType == "password" ? "text" : "password")}
				>
					{toggleType == "password"
						? (
								<Icon icon="lucide:eye" className="text-primary h-4 w-4" />
							)
						: (
								<Icon icon="lucide:eye-off" className="text-primary h-4 w-4" />
							)}
				</div>
			)}
			{iconPosition == "right" && (
				<div
					className={cn(
						"absolute inset-y-0 right-0 my-px ml-px flex items-center justify-center rounded-r-md p-4",
						iconClick ? "cursor-pointer" : "",
						isFile ? "border bg-secondary px-8" : "",
					)}
					onClick={iconClick}
				>
					{icon}
				</div>
			)}
		</div>
	)
}

export { Input }
