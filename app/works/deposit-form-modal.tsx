"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"

import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { NumberInput } from "@/components/common/input-number"
import Popover from "@/components/common/popover"
import { swal } from "@/components/common/sweetalert"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useUpdateWork, useWorkById } from "@/lib/react-query/works"
import { useLoadingStore } from "@/providers/loading-store-provider"
import { cn, convertDateToThai } from "@/utils/helpers"
import Loading from "@/components/common/loading"
import ErrorComponent from "@/components/common/error"

// Zod schema for deposit form
const depositFormSchema = z.object({
	deposit_date: z.date({ error: "กรุณาระบุ" }),
	deposit_amount: z
		.number({ error: "กรุณาระบุ" })
		.min(0.01, { message: "กรุณาระบุยอดเงินที่โอน" }),
})

type DepositFormValues = z.infer<typeof depositFormSchema>

interface DepositFormModalProps {
	workId: number
	onClose: () => void
	onSuccess?: () => void
}

export default function DepositFormModal({ workId, onClose, onSuccess }: DepositFormModalProps) {
	const workData = useWorkById(workId)

	if (workData.isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loading />
			</div>
		)
	}

	if (workData.isError) {
		const err = workData.error as any
		return <ErrorComponent statusCode={err.response?.status || 500} />
	}

	return (
		<DepositFormModalData
			workId={workId}
			workData={workData.data!}
			onClose={onClose}
			onSuccess={onSuccess}
		/>
	)
}

function DepositFormModalData({ workId, workData, onClose, onSuccess }: any) {
	const updateLoading = useLoadingStore(state => state.updateLoading)
	const updateWork = useUpdateWork()

	const form = useForm<DepositFormValues>({
		resolver: zodResolver(depositFormSchema),
		defaultValues: {
			deposit_date: workData.deposit_date ? new Date(workData.deposit_date) : undefined,
			deposit_amount: workData.deposit_amount ? Number(workData.deposit_amount) : undefined,
		},
	})

	const onSubmit = async (data: DepositFormValues) => {
		updateLoading(true)
		try {
			// Format data for API - include all required fields from original work data
			const formattedData = {
				id: workId,
				schedule_id: workData.schedule_id,
				total_amount: workData.total_amount,
				df_amount: workData.df_amount,
				bank_id: workData.bank_id,
				forecast_payment_date: format(new Date(workData.forecast_payment_date), "yyyy-MM-dd"),
				deposit_date: format(data.deposit_date, "yyyy-MM-dd"),
				deposit_amount: data.deposit_amount,
				remark: workData.remark || undefined,
			}

			await updateWork.mutateAsync(formattedData)

			updateLoading(false)
			onSuccess?.()
			onClose()
			toast.success("บันทึกข้อมูลการโอนเงินสำเร็จ")
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

	const isLoading = updateWork.isPending

	return (
		<>
			<div className="mb-4">
				<h3 className="text-lg font-semibold">บันทึกการโอนเงิน</h3>
				<p className="text-sm text-muted-foreground">
					{workData.schedule_place_name} - {workData.schedule_place_branch}
				</p>
			</div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="deposit_date"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>วันที่โอนจริง</FormLabel>
								<Popover
									type="calendar"
									trigger={(
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start pl-3 text-left font-normal",
												!field.value && "text-muted-foreground",
												form.formState.errors.deposit_date && "border-destructive",
											)}
										>
											{field.value
												? (
														convertDateToThai(field.value, "dd MMM yyyy")
													)
												: (
														<span className="text-black/50">เลือกวันที่โอนจริง</span>
													)}
										</Button>
									)}
									side="bottom"
								>
									<Calendar mode="single" selected={field.value!} onSelect={field.onChange} />
								</Popover>
								<FormMessage />
							</FormItem>

						)}
					/>

					<FormField
						control={form.control}
						name="deposit_amount"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>ยอดที่โอน (บาท)</FormLabel>
								<FormControl>
									<NumberInput
										value={field.value}
										onValueChange={field.onChange}
										disabled={isLoading}
										thousandSeparator=","
										decimalScale={2}
										placeholder="0.00"
										allowNegative={false}
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
