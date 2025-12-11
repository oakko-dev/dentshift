export interface WorkDataList {
	id: number
	schedule_id: number
	schedule_place_name?: string
	schedule_place_branch?: string
	schedule_appointment_date?: string
	total_amount: number
	df_amount: number
	bank_id: number
	bank_account_name?: string
	bank_account_number?: string
	forecast_payment_date: string
	deposit_date?: string
	deposit_amount?: number
	remark?: string
	created_at: string
}

export interface WorkData {
	id: number
	schedule_id: number
	schedule_place_name?: string
	schedule_place_branch?: string
	schedule_appointment_date?: string
	total_amount: number
	df_amount: number
	bank_id: number
	bank_account_name?: string
	bank_account_number?: string
	forecast_payment_date: string
	deposit_date?: string
	deposit_amount?: number
	remark?: string
	created_at: string
}

export interface CreateWorkInput {
	schedule_id: number
	total_amount: number
	df_amount: number
	bank_id: number
	forecast_payment_date: string
	deposit_date?: string
	deposit_amount?: number
	remark?: string
}

export interface UpdateWorkInput extends CreateWorkInput {
	id: number
}
