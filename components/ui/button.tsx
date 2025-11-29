import type { VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/utils/helpers"

const buttonVariants = cva(
	"aria-invalid:!ring-destructive/20 aria-invalid:!border-destructive inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border whitespace-nowrap transition-all outline-none disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground hover:bg-primary/90 border-transparent shadow-xs disabled:opacity-50",
				destructive:
					"bg-destructive hover:bg-destructive/90 border-transparent text-white shadow-xs disabled:opacity-50",
				outline:
					"bg-background hover:bg-accent hover:text-accent-foreground disabled:bg-secondary disabled:text-foreground/60 border-input border shadow-xs",
				white: "bg-background text-primary hover:bg-accent hover:text-accent-foreground border-0 shadow-xs disabled:opacity-50",
				calendar: "bg-background border shadow-xs disabled:opacity-50",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary-hover border-transparent shadow-xs disabled:opacity-50",
				secondaryOutline:
					"bg-secondary text-secondary-foreground hover:bg-secondary-hover border shadow-xs disabled:opacity-50",
				ghost: "hover:bg-accent hover:text-accent-foreground border-transparent disabled:opacity-50",
				link: "text-primary border-transparent underline-offset-4 hover:underline disabled:opacity-50",
				linkBlack: "border-transparent underline-offset-4 hover:underline disabled:opacity-50",
			},
			size: {
				default: "px-4 py-2 text-base has-[>svg]:px-4",
				sm: "px-3 py-1 text-sm has-[>svg]:px-3",
				lg: "px-6 py-3 text-base has-[>svg]:px-6",
				icon: "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
)

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button">
	& VariantProps<typeof buttonVariants> & {
		asChild?: boolean
	}) {
	const Comp = asChild ? Slot : "button"

	return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
