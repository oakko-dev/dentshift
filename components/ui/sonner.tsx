"use client"

import type { ToasterProps } from "sonner"
import { Icon } from "@iconify/react"
import { Toaster as Sonner } from "sonner"

function Toaster({ ...props }: ToasterProps) {
	return (
		<Sonner
			className="toaster group"
			position="top-center"
			icons={{
				success: <Icon icon="ic:sharp-check-circle-outline" className="text-primary size-4" />,
				info: <Icon icon="iconamoon:information-circle" className="text-primary size-4" />,
				warning: <Icon icon="gravity-ui:circle-exclamation" className="text-warning size-4" />,
				error: <Icon icon="bx:x-circle" className="text-destructive size-4" />,
				loading: <Icon icon="mdi:loading" className="text-primary size-4 animate-spin" />,
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			{...props}
		/>
	)
}

export { Toaster }
