export interface ScheduleDataList {
	id: number
	place_id: number
	place_name?: string
	place_branch?: string
	place_start_time?: string
	place_end_time?: string
	appointment_date: string
	df_guarantee_amount: number
	df_percent: number
	remark?: string
	created_at: string
}

export interface ScheduleData {
	id: number
	place_id: number
	place_name?: string
	place_branch?: string
	place_start_time?: string
	place_end_time?: string
	appointment_date: string
	df_guarantee_amount: number
	df_percent: number
	remark?: string
	created_at: string
}

export interface CreateScheduleInput {
	appointment_date: string
	place_id: number
	df_guarantee_amount: number
	df_percent: number
	remark?: string
}

export interface UpdateScheduleInput extends CreateScheduleInput {
	id: number
}
