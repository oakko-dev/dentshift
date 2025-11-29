"use client"

import * as React from "react"
import { NumericFormat, NumericFormatProps } from "react-number-format"
import { cn } from "@/utils/helpers"

interface NumberInputProps extends Omit<NumericFormatProps, "onValueChange"> {
	onValueChange?: (value: number | undefined) => void
	className?: string
}

function NumberInput({ ref, className, onValueChange, ...props }: NumberInputProps & { ref?: React.RefObject<HTMLInputElement | null> }) {
	return (
		<NumericFormat
			getInputRef={ref}
			className={cn(
				"flex w-full min-w-0 rounded-sm border border-input bg-transparent px-4 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-secondary",
				"focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
				"aria-invalid:border-destructive aria-invalid:ring-destructive/20",
				className,
			)}
			onValueChange={(values) => {
				const { floatValue } = values
				onValueChange?.(floatValue)
			}}
			{...props}
		/>
	)
}

NumberInput.displayName = "NumberInput"

export { NumberInput }
