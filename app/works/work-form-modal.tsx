"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"

import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { Combobox } from "@/components/common/combobox"
import ErrorComponent from "@/components/common/error"
import { NumberInput } from "@/components/common/input-number"
import Loading from "@/components/common/loading"
import Popover from "@/components/common/popover"
import { swal } from "@/components/common/sweetalert"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useBankMasterLists } from "@/lib/react-query/banks"
import { useScheduleMasterLists } from "@/lib/react-query/schedules"
import { useCreateWork, useUpdateWork, useWorkById } from "@/lib/react-query/works"
import { useLoadingStore } from "@/providers/loading-store-provider"
import { cn, convertDateToThai } from "@/utils/helpers"

// Zod schema for work form
const workFormSchema = z.object({
	schedule_id: z.number({ error: "กรุณาระบุ" }).min(1, { message: "กรุณาระบุ" }),
	total_amount: z
		.number({ error: "กรุณาระบุ" })
		.min(1, { message: "กรุณาระบุ" }),
	df_amount: z
		.number({ error: "กรุณาระบุ" })
		.min(1, { message: "กรุณาระบุ" }),
	bank_id: z.number({ error: "กรุณาระบุ" }).min(1, { message: "กรุณาระบุ" }),
	forecast_payment_date: z.date({ error: "กรุณาระบุ" }),
	remark: z.string().optional(),
})

type WorkFormValues = z.infer<typeof workFormSchema>

interface WorkFormModalProps {
	workId?: number | null
	onClose: () => void
	onSuccess?: () => void
}

const defaultData: any = {
	schedule_id: undefined,
	total_amount: undefined,
	df_amount: undefined,
	bank_id: undefined,
	forecast_payment_date: undefined,
	remark: "",
}

export default function WorkForm({ workId, onClose, onSuccess }: WorkFormModalProps) {
	const workData = useWorkById(workId!)
	// Pass the current schedule_id when editing to include it in the list
	const schedules = useScheduleMasterLists(workData.data?.schedule_id)
	const banks = useBankMasterLists()

	if (workData.isLoading || schedules.isLoading || banks.isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loading />
			</div>
		)
	}

	if (workData.isError || schedules.isError || banks.isError) {
		const err = (workData.error || schedules.error || banks.error) as any
		return <ErrorComponent statusCode={err.response?.status || 500} />
	}

	return (
		<WorkFormModalData
			workId={workId}
			workData={workData.data ? workData.data : defaultData}
			scheduleData={schedules.data ? schedules.data : []}
			bankData={banks.data ? banks.data : []}
			onClose={onClose}
			onSuccess={onSuccess}
		/>
	)
}

function WorkFormModalData({ workId, workData, scheduleData, bankData, onClose, onSuccess }: any) {
	const updateLoading = useLoadingStore(state => state.updateLoading)
	const createWork = useCreateWork()
	const updateWork = useUpdateWork()

	const form = useForm<WorkFormValues>({
		resolver: zodResolver(workFormSchema),
		defaultValues: {
			...workData,
			forecast_payment_date: workData.forecast_payment_date ? new Date(workData.forecast_payment_date) : undefined,
		},
	})

	const onSubmit = async (data: WorkFormValues) => {
		updateLoading(true)
		try {
			// Format data for API
			const formattedData = {
				...data,
				forecast_payment_date: format(data.forecast_payment_date, "yyyy-MM-dd"),
			}

			if (workId) {
				// Update existing work
				await updateWork.mutateAsync({
					...formattedData,
					id: workId,
				})
			}
			else {
				// Create new work
				await createWork.mutateAsync(formattedData)
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

	const isLoading = createWork.isPending || updateWork.isPending

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="schedule_id"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>นัดหมาย</FormLabel>
								<FormControl>
									<Combobox
										{...field}
										options={scheduleData}
										placeholder="เลือกนัดหมาย"
										valueType="number"
										onChange={field.onChange}
										isError={form.formState.errors.schedule_id}
										disabled={isLoading}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="total_amount"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>ยอดรวมทั้งหมด (บาท)</FormLabel>
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

					<FormField
						control={form.control}
						name="df_amount"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>ยอด DF ทั้งหมด (บาท)</FormLabel>
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

					<FormField
						control={form.control}
						name="bank_id"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>บัญชีธนาคาร</FormLabel>
								<FormControl>
									<Combobox
										{...field}
										options={bankData}
										placeholder="เลือกบัญชีธนาคาร"
										valueType="number"
										onChange={field.onChange}
										isError={form.formState.errors.bank_id}
										disabled={isLoading}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="forecast_payment_date"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>วันที่คาดการณ์รับเงิน</FormLabel>
								<Popover
									type="calendar"
									trigger={(
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start pl-3 text-left font-normal",
												!field.value && "text-muted-foreground",
												form.formState.errors.forecast_payment_date && "border-destructive",
											)}
										>
											{field.value
												? (
														convertDateToThai(field.value, "dd MMM yyyy")
													)
												: (
														<span className="text-black/50">วันที่คาดการณ์รับเงิน</span>
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
						name="remark"
						render={({ field }) => (
							<FormItem>
								<FormLabel>หมายเหตุ</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										disabled={isLoading}
										rows={3}
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
