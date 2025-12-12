export interface BankData {
	id: number
	account_name: string
	account_number: string
}

export interface BankDataList {
	id: number
	account_name: string
	account_number: string
}

export interface CreateBankInput {
	account_name: string
	account_number: string
}

export interface UpdateBankInput {
	id: number
	account_name: string
	account_number: string
}

