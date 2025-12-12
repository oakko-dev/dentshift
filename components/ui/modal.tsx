import { Icon } from "@iconify/react"
import * as Dialog from "@radix-ui/react-dialog"
import { AnimatePresence, motion } from "framer-motion"

import { JSX, useEffect } from "react"
import { cn } from "@/utils/helpers"
import { Button } from "../ui/button"

interface ModalProps {
	open: boolean
	header?: string
	children: JSX.Element
	size?: "sm" | "md" | "lg" | "xl"
	multiple?: boolean
	onClose?: () => void
}

export default function Modal({ open, header, children, size = "md", multiple = false, onClose }: ModalProps) {
	useEffect(() => {
		if (open) {
			// Pushing the change to the end of the call stack
			const timer = setTimeout(() => {
				document.body.style.pointerEvents = ""
			}, 0)

			return () => clearTimeout(timer)
		}
		else {
			document.body.style.pointerEvents = "auto"
		}
	}, [open])

	const avoidDefaultDomBehavior = (e: Event) => {
		e.preventDefault()
	}

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && onClose)
					onClose()
			}}
		>
			<AnimatePresence>
				{open && (
					<Dialog.Portal forceMount>
						<Dialog.Overlay
							forceMount
							asChild
							className={cn(
								multiple ? "z-1002" : "z-1000",
								"data-[state=open]:animate-overlayShow absolute inset-0 h-full w-screen bg-black/30",
							)}
						>
							<motion.div
								className="backdrop"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{
									delay: 0.1,
								}}
							/>
						</Dialog.Overlay>
						<Dialog.Content
							asChild
							forceMount
							onPointerDownOutside={avoidDefaultDomBehavior}
							onInteractOutside={avoidDefaultDomBehavior}
							className={cn(
								multiple ? "z-1003" : "z-1001",
								size == "sm"
									? "max-w-sm"
									: size == "md"
										? "max-w-5xl"
										: size == "lg"
											? "max-w-6xl"
											: "max-w-[1440px]",
								"data-[state=open]:animate-contentShow fixed top-0 left-[50%] h-full w-full translate-x-[-50%] sm:rounded-[20px] bg-white pb-6 focus:outline-none md:top-[50%] md:h-auto md:translate-y-[-50%]",
							)}
						>
							<motion.div
								initial={{ y: -5, scaleX: 0.95 }}
								animate={{ y: 0, scaleX: 1 }}
								exit={{ opacity: 0, transition: { duration: 0.25 } }}
								className="dialog-body"
							>
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{
										delay: 0.15,
									}}
								>
									<Dialog.Title />
									<Dialog.Description />
									<div
										className={`${onClose != null ? "border-b" : ""} mx-6 flex items-center border-[#E1E2E3] py-6 ${onClose != null ? "justify-between" : "justify-start"}`}
									>
										<h1 className="text-2xl font-semibold">{header}</h1>
										{onClose != null && (
											<Button variant="ghost" size="icon" onClick={onClose}>
												<Icon icon="lucide:x" className="size-6" />
											</Button>
										)}
									</div>
									<div className="xs:max-h-[calc(100vh-81px)] max-h-[calc(100vh-120px)] overflow-y-auto px-6 pt-6 pb-12 md:max-h-[85vh] md:pb-0">
										{children}
									</div>
								</motion.div>
							</motion.div>
						</Dialog.Content>
					</Dialog.Portal>
				)}
			</AnimatePresence>
		</Dialog.Root>
	)
}
