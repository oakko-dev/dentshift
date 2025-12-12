"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Combobox } from "@/components/common/combobox"
import ErrorComponent from "@/components/common/error"
import Loading from "@/components/common/loading"
import { swal } from "@/components/common/sweetalert"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreatePlace, usePlaceById, useUpdatePlace } from "@/lib/react-query/places"
import { useLoadingStore } from "@/providers/loading-store-provider"
import { TaxType } from "@/types/places"

// Zod schema for place form
const placeFormSchema = z.object({
	name: z.string().min(1, { message: "กรุณาระบุชื่อสถานที่" }),
	branch: z.string().min(1, { message: "กรุณาระบุสาขา" }),
	location: z.string().optional(),
	tag: z.string().optional(),
	start_time: z.string().min(1, { message: "กรุณาระบุเวลาเริ่มต้น" }),
	end_time: z.string().min(1, { message: "กรุณาระบุเวลาสิ้นสุด" }),
	tax_type: z.nativeEnum(TaxType, { message: "กรุณาระบุประเภทภาษี" }),
	remark: z.string().optional(),
})

type PlaceFormValues = z.infer<typeof placeFormSchema>

interface PlaceFormModalProps {
	placeId?: number | null
	onClose: () => void
	onSuccess?: () => void
}

const defaultData: any = {
	name: "",
	branch: "",
	location: "",
	tag: "",
	start_time: "",
	end_time: "",
	tax_type: undefined,
	remark: "",
}

const taxTypeOptions = [
	{ value: TaxType.FULL, label: "เต็มจำนวน" },
	{ value: TaxType.VAT, label: "หัก ณ ที่จ่าย 3%" },
]

export default function PlaceForm({ placeId, onClose, onSuccess }: PlaceFormModalProps) {
	const placeData = usePlaceById(placeId!)

	// Only show loading for edit mode (when placeId exists)
	if (placeId && placeData.isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loading />
			</div>
		)
	}

	// Only show error for edit mode
	if (placeId && placeData.isError) {
		const err = placeData.error as any
		return <ErrorComponent statusCode={err.response?.status || 500} />
	}

	return (
		<PlaceFormModalData
			placeId={placeId}
			placeData={placeData.data ? placeData.data : defaultData}
			onClose={onClose}
			onSuccess={onSuccess}
		/>
	)
}

function PlaceFormModalData({ placeId, placeData, onClose, onSuccess }: any) {
	const updateLoading = useLoadingStore(state => state.updateLoading)
	const createPlace = useCreatePlace()
	const updatePlace = useUpdatePlace()

	// Convert ISO datetime strings to time format (HH:MM)
	const formatTimeForInput = (isoString: string) => {
		if (!isoString)
			return ""
		const date = new Date(isoString)
		const hours = date.getUTCHours().toString().padStart(2, "0")
		const minutes = date.getUTCMinutes().toString().padStart(2, "0")
		return `${hours}:${minutes}`
	}

	// Convert time input (HH:MM) to ISO datetime string
	const formatTimeForAPI = (timeString: string) => {
		if (!timeString)
			return ""
		const [hours, minutes] = timeString.split(":")
		const date = new Date()
		date.setUTCHours(Number.parseInt(hours, 10))
		date.setUTCMinutes(Number.parseInt(minutes, 10))
		date.setUTCSeconds(0)
		date.setUTCMilliseconds(0)
		return date.toISOString()
	}

	const formattedPlaceData = {
		...placeData,
		start_time: formatTimeForInput(placeData.start_time),
		end_time: formatTimeForInput(placeData.end_time),
	}

	const form = useForm<PlaceFormValues>({
		resolver: zodResolver(placeFormSchema),
		defaultValues: formattedPlaceData,
	})

	const onSubmit = async (data: PlaceFormValues) => {
		updateLoading(true)
		try {
			// Format data for API
			const formattedData = {
				...data,
				start_time: formatTimeForAPI(data.start_time),
				end_time: formatTimeForAPI(data.end_time),
			}

			if (placeId) {
				// Update existing place
				await updatePlace.mutateAsync({
					...formattedData,
					id: placeId,
				})
			}
			else {
				// Create new place
				await createPlace.mutateAsync(formattedData)
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

	const isLoading = createPlace.isPending || updatePlace.isPending

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>ชื่อสถานที่</FormLabel>
								<FormControl>
									<Input
										{...field}
										disabled={isLoading}
										placeholder="ระบุชื่อสถานที่"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="branch"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>สาขา</FormLabel>
								<FormControl>
									<Input
										{...field}
										disabled={isLoading}
										placeholder="ระบุสาขา"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="location"
						render={({ field }) => (
							<FormItem>
								<FormLabel>ลิงก์แผนที่</FormLabel>
								<FormControl>
									<Input
										{...field}
										disabled={isLoading}
										placeholder="https://maps.google.com/..."
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="tag"
						render={({ field }) => (
							<FormItem>
								<FormLabel>แท็ก (คั่นด้วยเครื่องหมายจุลภาค)</FormLabel>
								<FormControl>
									<Input
										{...field}
										disabled={isLoading}
										placeholder="แท็ก1, แท็ก2, แท็ก3"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="start_time"
							render={({ field }) => (
								<FormItem>
									<FormLabel isRequired>เวลาเริ่มต้น</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="time"
											disabled={isLoading}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="end_time"
							render={({ field }) => (
								<FormItem>
									<FormLabel isRequired>เวลาสิ้นสุด</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="time"
											disabled={isLoading}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="tax_type"
						render={({ field }) => (
							<FormItem>
								<FormLabel isRequired>การคิดเงิน</FormLabel>
								<FormControl>
									<Combobox
										{...field}
										options={taxTypeOptions}
										placeholder="เลือกประเภทการคิดเงิน"
										valueType="string"
										onChange={field.onChange}
										isError={form.formState.errors.tax_type}
										disabled={isLoading}
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
