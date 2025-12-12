"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import ErrorComponent from "@/components/common/error"
import Loading from "@/components/common/loading"
import { swal } from "@/components/common/sweetalert"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useBankById, useCreateBank, useUpdateBank } from "@/lib/react-query/banks"
import { useLoadingStore } from "@/providers/loading-store-provider"

// Zod schema for bank form
const bankFormSchema = z.object({
	account_name: z.string().min(1, { message: "กรุณาระบุชื่อบัญชี" }),
	account_number: z.string().min(1, { message: "กรุณาระบุเลขที่บัญชี" }),
})

type BankFormValues = z.infer<typeof bankFormSchema>

interface BankFormModalProps {
	bankId?: number | null
	onClose: () => void
	onSuccess?: () => void
}

const defaultData: any = {
	account_name: "",
	account_number: "",
}

export default function BankForm({ bankId, onClose, onSuccess }: BankFormModalProps) {
	const bankData = useBankById(bankId!)

	// Only show loading for edit mode (when bankId exists)
	if (bankId && bankData.isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loading />
			</div>
		)
	}

	// Only show error for edit mode
	if (bankId && bankData.isError) {
		const err = bankData.error as any
		return <ErrorComponent statusCode={err.response?.status || 500} />
	}

	return (
		<BankFormModalData
			bankId={bankId}
			bankData={bankData.data ? bankData.data : defaultData}
			onClose={onClose}
			onSuccess={onSuccess}
		/>
	)
}

function BankFormModalData({ bankId, bankData, onClose, onSuccess }: any) {
	const updateLoading = useLoadingStore(state => state.updateLoading)
	const createBank = useCreateBank()
	const updateBank = useUpdateBank()

	const form = useForm<BankFormValues>({
		resolver: zodResolver(bankFormSchema),
		defaultValues: bankData,
	})

	const onSubmit = async (data: BankFormValues) => {
		updateLoading(true)
		try {
			if (bankId) {
				// Update existing bank
				await updateBank.mutateAsync({
					...data,
					id: bankId,
				})
			}
			else {
				// Create new bank
				await createBank.mutateAsync(data)
			}

			updateLoading(false)
			onSuccess?.()
			onClose()
			toast.success("บันทึกข้อมูลสำเร็จ")
		}
		catch (error: any) {
			updateLoading(false)
			swal.fire({
				title: "เกิดข้อผิดพลาด",
				text: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
				icon: "error",
			})
		}
	}

	const isLoading = createBank.isPending || updateBank.isPending

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="account_name"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>ชื่อบัญชี</FormLabel>
								<FormControl>
									<Input
										{...field}
										disabled={isLoading}
										placeholder="ระบุชื่อบัญชี"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="account_number"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>เลขที่บัญชี</FormLabel>
								<FormControl>
									<Input
										{...field}
										disabled={isLoading}
										placeholder="ระบุเลขที่บัญชี"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex justify-end gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isLoading}
						>
							ยกเลิก
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "กำลังบันทึก..." : "บันทึก"}
						</Button>
					</div>
				</form>
			</Form>
		</>
	)
}

