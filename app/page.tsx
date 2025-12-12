"use client"

import { Icon } from "@iconify/react"
import { endOfMonth, format, getDay, startOfMonth } from "date-fns"
import { th } from "date-fns/locale"
import { uniqueId } from "lodash"
import { useMemo, useState } from "react"
import { Combobox } from "@/components/common/combobox"
import ErrorComponent from "@/components/common/error"
import { useDashboardStats } from "@/lib/react-query/dashboards"
import { useScheduleLists } from "@/lib/react-query/schedules"
import { MasterSelectProps } from "@/types/global"

// Separate component for stats cards to optimize re-rendering
function StatsCards({ year, month }: { year: number, month: number }) {
	// Fetch dashboard stats
	const { data: dashboardStats, isLoading, isError, error } = useDashboardStats({
		year,
		month,
	})

	// Format currency for display
	const formatCurrency = (amount: number) => {
		if (amount >= 1000) {
			return `฿${(amount / 1000).toFixed(1)}K`
		}
		return `฿${amount}`
	}

	// Memoize stats configuration
	const stats = useMemo(() => [
		{
			icon: "lucide:briefcase",
			label: "งานเดือนนี้",
			value: dashboardStats?.scheduleCount.toString() || "0",
		},
		{
			icon: "lucide:dollar-sign",
			label: "รายรับเดือนนี้",
			value: formatCurrency(dashboardStats?.dfGuaranteeAmount || 0),
		},
		{
			icon: "lucide:clock",
			label: "รอรับเงิน",
			value: dashboardStats?.waitingDepositCount.toString() || "0",
		},
		{
			icon: "lucide:map-pin",
			label: "สถานที่ทำงาน",
			value: dashboardStats?.placeCount.toString() || "0",
		},
	], [dashboardStats])

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[...Array.from({ length: 4 })].map((_, index) => (
					<div
						key={uniqueId()}
						className="relative animate-pulse overflow-hidden rounded-xl bg-gray-200 p-6 shadow-lg"
					>
						<div className="mb-2 h-4 w-24 rounded bg-gray-300"></div>
						<div className="h-8 w-16 rounded bg-gray-300"></div>
					</div>
				))}
			</div>
		)
	}

	if (isError) {
		const err = error as any
		return <ErrorComponent statusCode={err.response?.status || 500} />
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{stats.map(stat => (
				<div
					key={uniqueId()}
					className="text-foreground relative overflow-hidden rounded-xl border bg-white p-6  transition-all duration-300 hover:scale-105 hover:shadow-2xs"
				>
					{/* Label */}
					<div className="relative text-sm font-medium opacity-90">
						{stat.label}
					</div>

					{/* Value */}
					<div className="relative mt-2 text-3xl font-bold">
						{stat.value}
					</div>
				</div>
			))}
		</div>
	)
}

export default function Home() {
	const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
	const [calendarMonth, setCalendarMonth] = useState(() => new Date())

	// Memoize month options to prevent recreation on every render
	const monthOptions: MasterSelectProps[] = useMemo(() => [
		"มกราคม",
		"กุมภาพันธ์",
		"มีนาคม",
		"เมษายน",
		"พฤษภาคม",
		"มิถุนายน",
		"กรกฎาคม",
		"สิงหาคม",
		"กันยายน",
		"ตุลาคม",
		"พฤศจิกายน",
		"ธันวาคม",
	].map((month, index) => ({
		label: month,
		value: index,
	})), [])

	// Memoize year options to prevent recreation on every render
	const yearOptions: MasterSelectProps[] = useMemo(() => {
		const currentYear = new Date().getFullYear()
		return Array.from({ length: 7 }, (_, i) => {
			const year = currentYear - 5 + i
			return {
				label: `${year + 543}`, // Buddhist Era
				value: year,
			}
		})
	}, [])

	const handleMonthChange = (value: string | number) => {
		const month = Number(value)
		setSelectedMonth(month)
	}

	const handleYearChange = (value: string | number) => {
		const year = Number(value)
		setSelectedYear(year)
	}

	// Fetch schedules for the calendar month
	const { data: schedulesData, isLoading: isLoadingSchedules } = useScheduleLists({
		page: 0,
		pageSize: 100, // Get enough to cover the month
	})

	// Create a map of dates with schedules
	const scheduleDateMap = useMemo(() => {
		const map = new Map<string, { place_name: string, place_branch?: string }>()
		if (schedulesData?.data) {
			schedulesData.data.forEach((schedule) => {
				const dateKey = format(new Date(schedule.appointment_date), "yyyy-MM-dd")
				map.set(dateKey, {
					place_name: schedule.place_name || "",
					place_branch: schedule.place_branch,
				})
			})
		}
		return map
	}, [schedulesData])

	// Get today's work
	const todayWork = useMemo(() => {
		if (!schedulesData?.data)
			return null
		const today = format(new Date(), "yyyy-MM-dd")
		return schedulesData.data.find(schedule => format(new Date(schedule.appointment_date), "yyyy-MM-dd") === today)
	}, [schedulesData])

	// Get upcoming work (next scheduled work after today)
	const upcomingWork = useMemo(() => {
		if (!schedulesData?.data)
			return null
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const futureSchedules = schedulesData.data
			.filter((schedule) => {
				const scheduleDate = new Date(schedule.appointment_date)
				scheduleDate.setHours(0, 0, 0, 0)
				return scheduleDate > today
			})
			.sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())

		return futureSchedules[0] || null
	}, [schedulesData])

	// Generate calendar grid
	const calendarDays = useMemo(() => {
		const start = startOfMonth(calendarMonth)
		const end = endOfMonth(calendarMonth)
		const startDay = getDay(start) // 0 = Sunday
		const daysInMonth = end.getDate()

		const days: (Date | null)[] = []

		// Add empty cells for days before the month starts
		for (let i = 0; i < startDay; i++) {
			days.push(null)
		}

		// Add all days of the month
		for (let i = 1; i <= daysInMonth; i++) {
			days.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i))
		}

		return days
	}, [calendarMonth])

	const handlePreviousMonth = () => {
		setCalendarMonth((prev) => {
			const newDate = new Date(prev)
			newDate.setMonth(prev.getMonth() - 1)
			return newDate
		})
	}

	const handleNextMonth = () => {
		setCalendarMonth((prev) => {
			const newDate = new Date(prev)
			newDate.setMonth(prev.getMonth() + 1)
			return newDate
		})
	}

	const handleToday = () => {
		setCalendarMonth(new Date())
	}

	return (
		<div className="space-y-6">
			{/* Sorting and Filter Bar */}
			<div className="bg-card flex flex-wrap items-center gap-3 rounded-lg border p-4">
				<Icon icon="lucide:calendar" className="text-foreground h-5 w-5" />
				<span className="text-foreground text-sm font-medium">เลือกเดือน:</span>
				<div className="flex gap-2">
					<div className="w-40">
						<Combobox
							options={monthOptions}
							value={selectedMonth}
							onChange={handleMonthChange}
							placeholder="เลือกเดือน"
							valueType="number"
						/>
					</div>
					<div className="w-32">
						<Combobox
							options={yearOptions}
							value={selectedYear}
							onChange={handleYearChange}
							placeholder="เลือกปี"
							valueType="number"
						/>
					</div>
				</div>
			</div>

			{/* Stats Grid - Only this component will re-render when month/year changes */}
			<StatsCards year={selectedYear} month={selectedMonth} />

			<div className="flex flex-col gap-4 lg:grid lg:grid-cols-12">
				{/* Calendar Section */}
				<div className="bg-card col-span-8 rounded-lg border p-6">
					<div className="mb-4 flex flex-wrap items-center justify-between gap-4">
						<div>
							<h2 className="text-foreground text-lg font-semibold">ปฏิทินนัดหมาย</h2>
							<p className="text-foreground/60 text-sm">จัดการตารางนัดของคุณ</p>
						</div>
						<div className="flex flex-wrap items-center justify-start gap-4 sm:gap-8">
							<button
								type="button"
								onClick={handleToday}
								className="bg-primary hover:bg-primary-dark flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
							>
								<Icon icon="lucide:calendar" className="h-4 w-4" />
								วันนี้
							</button>
							<div className="flex items-center justify-between gap-4">
								<button
									type="button"
									onClick={handlePreviousMonth}
									className="hover:bg-accent flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-colors"
								>
									<Icon icon="lucide:chevron-left" className="h-5 w-5" />
								</button>

								<div className="text-foreground text-center font-semibold">
									{format(calendarMonth, "MMMM yyyy", { locale: th }).replace(/\d{4}/, year => (Number.parseInt(year) + 543).toString())}
								</div>

								<button
									type="button"
									onClick={handleNextMonth}
									className="hover:bg-accent flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-colors"
								>
									<Icon icon="lucide:chevron-right" className="h-5 w-5" />
								</button>
							</div>
						</div>
					</div>

					<div className="mb-2 grid grid-cols-7 gap-2">
						{["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"].map(day => (
							<div key={day} className="text-foreground text-center text-sm font-medium">
								{day}
							</div>
						))}
					</div>

					{/* Calendar grid */}
					{isLoadingSchedules
						? (
								<div className="grid grid-cols-7 gap-2">
									{Array.from({ length: 35 }).map((_, idx) => (
										<div
											key={`skeleton-${calendarMonth.getMonth()}-${idx}`}
											className="flex min-h-[80px] animate-pulse flex-col rounded-lg border border-gray-200 bg-gray-100 p-2"
										>
											<div className="mb-2 h-4 w-6 rounded bg-gray-200"></div>
											<div className="h-3 w-full rounded bg-gray-200"></div>
										</div>
									))}
								</div>
							)
						: (
								<div className="grid grid-cols-7 gap-2">
									{calendarDays.map((date, index) => {
										if (!date) {
											return <div key={`empty-${calendarMonth.getMonth()}-${uniqueId()}`} className="min-h-[80px]" />
										}

										const dateKey = format(date, "yyyy-MM-dd")
										const schedule = scheduleDateMap.get(dateKey)
										const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
										const isPastMonth = date.getMonth() !== calendarMonth.getMonth()

										return (
											<div
												key={uniqueId()}
												className={`
											relative flex min-h-[80px] flex-col items-start justify-start rounded-lg border p-2 transition-colors
											${isToday ? "bg-primary hover:bg-primary-dark border-0 text-white" : "hover:bg-accent bg-white"}
											${schedule ? "border-primary/50 border" : "border-gray-200"}
											${isPastMonth ? "opacity-50" : ""}
										`}
											>
												<span className={`text-sm font-medium ${isToday ? "text-white" : "text-foreground"}`}>
													{format(date, "d")}
												</span>
												{schedule && (
													<span className={`mt-1 line-clamp-2 w-full text-[10px] ${isToday ? "text-white/90" : "text-primary"}`}>
														{schedule.place_name}
														{" "}
														{schedule.place_branch ? ` - ${schedule.place_branch}` : ""}
													</span>
												)}
											</div>
										)
									})}
								</div>
							)}
				</div>

				<div className="col-span-4 flex flex-col gap-4">
					{/* Today's Work */}
					<div className="bg-card rounded-lg border p-6">
						<div className="flex flex-col">
							<div className="mb-3 flex items-center gap-2">
								<Icon icon="lucide:calendar-check" className="text-primary h-5 w-5" />
								<h3 className="text-foreground text-lg font-semibold">งานวันนี้</h3>
							</div>
							{isLoadingSchedules
								? (
										<div className="animate-pulse space-y-4">
											<div className="h-9 w-3/4 rounded bg-gray-200"></div>
											<div className="h-6 w-1/2 rounded bg-gray-200"></div>
											<div className="space-y-2 rounded-lg bg-gray-100 p-3">
												<div className="h-4 w-full rounded bg-gray-200"></div>
												<div className="h-4 w-full rounded bg-gray-200"></div>
											</div>
										</div>
									)
								: todayWork
									? (
											<>
												<p className="text-foreground text-3xl font-bold">{todayWork.place_name}</p>
												{todayWork.place_branch && (
													<p className="text-foreground/80 text-lg">{todayWork.place_branch}</p>
												)}
												<div className="bg-primary/5 mt-4 flex flex-col gap-2 rounded-lg p-3">
													<div className="flex items-center justify-between text-sm">
														<span className="text-foreground/60">ค่ามัดจำ:</span>
														<span className="text-foreground font-semibold">
															฿
															{todayWork.df_guarantee_amount.toLocaleString()}
														</span>
													</div>
													<div className="flex items-center justify-between text-sm">
														<span className="text-foreground/60">เปอร์เซ็นต์:</span>
														<span className="text-foreground font-semibold">
															{todayWork.df_percent}
															%
														</span>
													</div>
												</div>
												{todayWork.remark && (
													<div className="mt-3">
														<p className="text-foreground/60 text-sm">หมายเหตุ:</p>
														<p className="text-foreground text-sm">{todayWork.remark}</p>
													</div>
												)}
											</>
										)
									: (
											<div className="flex flex-col items-center justify-center py-8">
												<Icon icon="lucide:calendar-x" className="text-foreground/20 mb-2 h-12 w-12" />
												<p className="text-foreground/60">ไม่มีงานวันนี้</p>
											</div>
										)}
						</div>
					</div>

					{/* Upcoming Work */}
					<div className="bg-card rounded-lg border p-6">
						<div className="flex flex-col">
							<div className="mb-3 flex items-center gap-2">
								<Icon icon="lucide:calendar-clock" className="text-warning h-5 w-5" />
								<h3 className="text-foreground text-lg font-semibold">งานที่จะมาถึง</h3>
							</div>
							{isLoadingSchedules
								? (
										<div className="animate-pulse space-y-4">
											<div className="h-9 w-3/4 rounded bg-gray-200"></div>
											<div className="h-6 w-1/2 rounded bg-gray-200"></div>
											<div className="h-5 w-2/3 rounded bg-gray-200"></div>
											<div className="space-y-2 rounded-lg bg-gray-100 p-3">
												<div className="h-4 w-full rounded bg-gray-200"></div>
												<div className="h-4 w-full rounded bg-gray-200"></div>
											</div>
										</div>
									)
								: upcomingWork
									? (
											<>
												<p className="text-foreground text-3xl font-bold">{upcomingWork.place_name}</p>
												{upcomingWork.place_branch && (
													<p className="text-foreground/80 text-lg">{upcomingWork.place_branch}</p>
												)}
												<div className="mt-3 flex items-center gap-2">
													<Icon icon="lucide:calendar" className="text-foreground/60 h-4 w-4" />
													<p className="text-foreground text-sm font-medium">
														{format(new Date(upcomingWork.appointment_date), "d MMMM yyyy", { locale: th }).replace(/\d{4}/, year => (Number.parseInt(year) + 543).toString())}
													</p>
												</div>
												<div className="bg-warning/5 mt-4 flex flex-col gap-2 rounded-lg p-3">
													<div className="flex items-center justify-between text-sm">
														<span className="text-foreground/60">ค่ามัดจำ:</span>
														<span className="text-foreground font-semibold">
															฿
															{upcomingWork.df_guarantee_amount.toLocaleString()}
														</span>
													</div>
													<div className="flex items-center justify-between text-sm">
														<span className="text-foreground/60">เปอร์เซ็นต์:</span>
														<span className="text-foreground font-semibold">
															{upcomingWork.df_percent}
															%
														</span>
													</div>
												</div>
												{upcomingWork.remark && (
													<div className="mt-3">
														<p className="text-foreground/60 text-sm">หมายเหตุ:</p>
														<p className="text-foreground text-sm">{upcomingWork.remark}</p>
													</div>
												)}
											</>
										)
									: (
											<div className="flex flex-col items-center justify-center py-8">
												<Icon icon="lucide:calendar-x" className="text-foreground/20 mb-2 h-12 w-12" />
												<p className="text-foreground/60">ไม่มีงานที่จะมาถึง</p>
											</div>
										)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
