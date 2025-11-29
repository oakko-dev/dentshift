"use client"

import { Icon } from "@iconify/react"
import { uniqueId } from "lodash"

import * as React from "react"
import { FieldError } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MasterSelectProps } from "@/types/global"
import { cn } from "@/utils/helpers"

interface ComboBoxProps {
	options?: MasterSelectProps[]
	placeholder?: string
	value?: string | number | null
	valueType?: "string" | "number"
	onChange?: (value: string | number) => void
	isError?: FieldError
	disabled?: boolean
}

export function Combobox(props: ComboBoxProps) {
	const {
		options,
		placeholder = "- เลือก -",
		value,
		valueType = "number",
		onChange,
		isError = false,
		disabled = false,
	} = props
	const [open, setOpen] = React.useState(false)
	const selectedOption = options?.find(option => option.value == value)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn(
						"w-full justify-between rounded-sm!",
						selectedOption ? "" : "text-foreground/60 transition-colors duration-200 ease-in-out",
						isError ? "border-destructive" : "border-input",
					)}
					disabled={disabled}
				>
					<div className="truncate">
						{selectedOption !== undefined ? selectedOption?.label : placeholder}
					</div>
					<Icon icon="lucide:chevron-down" className="opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-(--radix-popover-trigger-width) p-0">
				<Command>
					<CommandInput placeholder={placeholder} />
					<CommandList>
						<CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
						<CommandGroup>
							{options?.map((option, index) => (
								<CommandItem
									value={String(option.label)}
									key={uniqueId()}
									onSelect={(currentValue) => {
										const value = options?.find(
											option => option.label.toLowerCase() == currentValue.toLowerCase(),
										)?.value
										onChange?.(valueType == "string" ? String(value!) : Number(value!))
										setOpen(false)
									}}
								>
									{option.label}
									<Icon icon="lucide:check" className={cn("ml-auto", value == option.value ? "opacity-100" : "opacity-0")} />
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
