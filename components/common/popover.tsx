import { JSX, useState } from "react"

import { PopoverContent, PopoverTrigger, Popover as PopoverUI } from "@/components/ui/popover"
import { cn } from "@/utils/helpers"

interface PopoverType {
	type?: "modal" | "calendar" | "popover" | "popover-small"
	trigger: JSX.Element | JSX.Element[]
	header?: string
	side?: "right" | "top" | "bottom" | "left" | undefined
	children: JSX.Element | JSX.Element[]
	openOnHover?: boolean
}

export default function Popover(props: PopoverType) {
	const { type = "modal", trigger, header, side = "right", children, openOnHover = false } = props
	const [isOpen, setIsOpen] = useState(false)

	const handleMouseEnter = () => {
		if (openOnHover)
			setIsOpen(true)
	}

	const handleMouseLeave = () => {
		if (openOnHover)
			setIsOpen(false)
	}

	return (
		<PopoverUI open={openOnHover ? isOpen : undefined}>
			<div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
				<PopoverTrigger asChild>{trigger}</PopoverTrigger>
				<PopoverContent
					align="start"
					avoidCollisions={true}
					side={side}
					className={cn(
						type == "modal"
							? "max-w-[500px] min-w-[300px] p-6 lg:min-w-[412px]"
							: type == "calendar"
								? "w-auto"
								: type == "popover-small"
									? "max-w-[200px] min-w-[200px] p-4 lg:min-w-[200px]"
									: "max-w-[300px] min-w-[300px] p-6 lg:min-w-[300px]",
					)}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
				>
					{type == "modal"
						? (
								<>
									{header && <h1 className="mb-6 text-lg font-semibold">{header}</h1>}
									<div className="content">{children}</div>
								</>
							)
						: (
								children
							)}
				</PopoverContent>
			</div>
		</PopoverUI>
	)
}
