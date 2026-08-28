"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { normalizeThaiPhone } from "@/lib/profile"
import { useLoadingStore } from "@/providers/loading-store-provider"

interface ProfileFormProps { required: boolean }
interface Profile { firstname: string, lastname: string, phoneNumber: string }

export function ProfileForm({ required }: ProfileFormProps) {
	const updateLoading = useLoadingStore(state => state.updateLoading)
	const [profile, setProfile] = useState<Profile>({ firstname: "", lastname: "", phoneNumber: "" })
	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [message, setMessage] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		fetch("/api/profile").then(async (response) => {
			if (!response.ok)
				throw new Error("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้")
			const data = await response.json() as Profile
			setProfile({ firstname: data.firstname ?? "", lastname: data.lastname ?? "", phoneNumber: data.phoneNumber ?? "" })
		}).catch(() => setError("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้")).finally(() => setIsLoading(false))
	}, [])

	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError(null)
		setMessage(null)
		if (!profile.firstname.trim() || !profile.lastname.trim()) {
			setError("กรุณาระบุชื่อและนามสกุล")
			return
		}
		try {
			normalizeThaiPhone(profile.phoneNumber)
			if (required && (!currentPassword || !newPassword))
				throw new Error("กรุณาระบุรหัสผ่านปัจจุบันและรหัสผ่านใหม่")
			if (newPassword && !currentPassword)
				throw new Error("กรุณาระบุรหัสผ่านปัจจุบันเพื่อเปลี่ยนรหัสผ่าน")
			setIsLoading(true)
			updateLoading(true)
			const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...profile, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }) })
			const data = await response.json() as { error?: string }
			if (!response.ok)
				throw new Error(data.error ?? "ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้")
			setCurrentPassword("")
			setNewPassword("")
			setMessage(required ? "ตั้งค่าโปรไฟล์เรียบร้อยแล้ว" : "บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว")
			if (required)
				window.location.assign("/")
		}
		catch (caughtError) {
			setError(caughtError instanceof Error ? caughtError.message : "ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้")
		}
		finally {
			setIsLoading(false)
			updateLoading(false)
		}
	}

	if (isLoading && !profile.firstname && !error)
		return <p>กำลังโหลดข้อมูลโปรไฟล์...</p>

	return (
		<form onSubmit={submit} className="mx-auto max-w-lg space-y-5 rounded-xl border bg-white p-6 shadow-sm">
			<div>
				<h1 className="text-2xl font-semibold">{required ? "ตั้งค่าโปรไฟล์" : "การตั้งค่าโปรไฟล์"}</h1>
				<p className="text-muted-foreground mt-1 text-sm">{required ? "กรุณากรอกข้อมูลให้ครบถ้วนก่อนดำเนินการต่อ" : "แก้ไขข้อมูลติดต่อหรือเปลี่ยนรหัสผ่านของคุณ"}</p>
			</div>
			{([["firstname", "ชื่อ"], ["lastname", "นามสกุล"], ["phoneNumber", "หมายเลขโทรศัพท์"]] as const).map(([field, label]) => (
				<div key={field} className="space-y-2">
					<Label htmlFor={field}>{label}</Label>
					<Input id={field} value={profile[field]} onChange={event => setProfile({ ...profile, [field]: event.target.value })} placeholder={field === "phoneNumber" ? "08x-xxx-xxxx หรือ +668x-xxx-xxxx" : label} disabled={isLoading} />
				</div>
			))}
			<div className="space-y-2 border-t pt-4">
				<h2 className="font-medium">{required ? "ยืนยันรหัสผ่านชั่วคราว" : "เปลี่ยนรหัสผ่าน (ไม่บังคับ)"}</h2>
				<Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
				<Input id="currentPassword" type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} autoComplete="current-password" disabled={isLoading} required={required || Boolean(newPassword)} />
				<Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
				<Input id="newPassword" type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" disabled={isLoading} required={required} />
			</div>
			{error && <p className="text-destructive text-sm">{error}</p>}
			{message && <p className="text-sm text-green-700">{message}</p>}
			<Button type="submit" disabled={isLoading}>{required ? "บันทึกโปรไฟล์" : "บันทึกการเปลี่ยนแปลง"}</Button>
		</form>
	)
}
