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
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { usePlaceMasterLists } from "@/lib/react-query/places"
import { useCreateSchedule, useScheduleById, useUpdateSchedule } from "@/lib/react-query/schedules"
import { useLoadingStore } from "@/providers/loading-store-provider"
import { cn, convertDateToThai } from "@/utils/helpers"

// Zod schema for schedule form
const scheduleFormSchema = z.object({
	appointment_date: z.date({ error: "กรุณาระบุ" }),
	place_id: z.number({ error: "กรุณาระบุ" }).min(1, { message: "กรุณาระบุ" }),
	df_guarantee_amount: z
		.number({ error: "กรุณาระบุ" })
		.min(1, { message: "กรุณาระบุ" }),
	df_percent: z
		.number({ error: "กรุณาระบุ" })
		.min(1, { message: "กรุณาระบุ" }),
	remark: z.string().optional(),
})

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>

interface ScheduleFormModalProps {
	scheduleId?: number | null
	onClose: () => void
	onSuccess?: () => void
}

const defaultData: any = {
	appointment_date: undefined,
	place_id: undefined,
	df_guarantee_amount: undefined,
	df_percent: undefined,
	remark: "",
}

export default function ScheduleForm({ scheduleId, onClose, onSuccess }: ScheduleFormModalProps) {
	const scheduleData = useScheduleById(scheduleId!)
	const places = usePlaceMasterLists()

	if (scheduleData.isLoading || places.isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loading />
			</div>
		)
	}

	if (scheduleData.isError || places.isError) {
		const err = (scheduleData.error || places.error) as any
		return <ErrorComponent statusCode={err.response.status} />
	}

	return (
		<ScheduleFormModalData
			scheduleId={scheduleId}
			scheduleData={scheduleData.data ? scheduleData.data : defaultData}
			placeData={places.data ? places.data : []}
			onClose={onClose}
			onSuccess={onSuccess}
		/>
	)
}

function ScheduleFormModalData({ scheduleId, scheduleData, placeData, onClose, onSuccess }: any) {
	const updateLoading = useLoadingStore(state => state.updateLoading)
	const createSchedule = useCreateSchedule()
	const updateSchedule = useUpdateSchedule()

	const form = useForm<ScheduleFormValues>({
		resolver: zodResolver(scheduleFormSchema),
		defaultValues: scheduleData,
	})

	const onSubmit = async (data: ScheduleFormValues) => {
		updateLoading(true)
		try {
			// Format data for API
			const formattedData = {
				...data,
				appointment_date: format(data.appointment_date, "yyyy-MM-dd"),
			}

			if (scheduleId) {
				// Update existing schedule
				await updateSchedule.mutateAsync({
					...formattedData,
					id: scheduleId,
				})
			}
			else {
				// Create new schedule
				await createSchedule.mutateAsync(formattedData)
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
				text: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบข้อมูล",
				icon: "error",
			})
		}
	}

	const isLoading = createSchedule.isPending || updateSchedule.isPending

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="appointment_date"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>วันที่นัดหมาย</FormLabel>
								<Popover
									type="calendar"
									trigger={(
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start pl-3 text-left font-normal",
												!field.value && "text-muted-foreground",
												form.formState.errors.appointment_date && "border-destructive",
											)}
										>
											{field.value
												? (
														convertDateToThai(field.value, "dd MMM yyyy")
													)
												: (
														<span className="text-black/50">วันที่นัดหมาย</span>
													)}
										</Button>
									)}
									side="bottom"
								>
									<Calendar mode="single" selected={field.value!} onSelect={field.onChange} disabled={{ before: new Date() }} />
								</Popover>
								<FormMessage />
							</FormItem>

						)}
					/>

					<FormField
						control={form.control}
						name="place_id"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>สถานที่</FormLabel>
								<FormControl>
									<Combobox
										{...field}
										options={placeData}
										placeholder="เลือกสถานที่"
										valueType="number"
										onChange={field.onChange}
										isError={form.formState.errors.place_id}
										disabled={isLoading}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="df_guarantee_amount"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>DF Guarantee (บาท)</FormLabel>
								<FormControl>
									<NumberInput
										value={field.value}
										onValueChange={field.onChange}
										disabled={isLoading}
										thousandSeparator=","
										decimalScale={0}
										placeholder="0"
										allowNegative={false}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="df_percent"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>
									DF Percent (%)
									{field.value !== undefined && field.value !== null && (
										<>
											{" "}
											-
											{" "}
											{field.value}
											%
										</>
									)}
								</FormLabel>
								<FormControl className="py-4">
									<Slider
										min={0}
										max={100}
										step={1}
										value={field.value as number ?? 0}
										defaultValue={0}
										onValueChange={(value) => {
											field.onChange(value)
										}}
									/>
								</FormControl>
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
