"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Icon } from "@iconify/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/lib/auth-client"
import { useLoadingStore } from "@/providers/loading-store-provider"

const loginSchema = z.object({
	email: z.email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
	const updateLoading = useLoadingStore(state => state.updateLoading)
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "admin@savvtac.co",
			password: "P@ssw0rd",
		},
	})

	const onSubmit = async (data: LoginFormData) => {
		setIsLoading(true)
		updateLoading(true)
		try {
			const result = await signIn.email({
				email: data.email,
				password: data.password,
				fetchOptions: {
					onSuccess: () => {
						// Use your framework's router to navigate to the dashboard
						// Example: router.push("/dashboard");
						console.log("Login successful! Navigating now.")
					},

				},
			})

			if (result.error) {
				toast.error(result.error.message || "Invalid email or password")
			}
			else {
				toast.success("Login successful!")
				// Small delay to ensure session is established
				await new Promise(resolve => setTimeout(resolve, 100))
				router.push("/")
				router.refresh()
			}
		}
		catch (error) {
			console.error("Login error:", error)
			toast.error("An error occurred during login")
		}
		finally {
			setIsLoading(false)
			updateLoading(false)
		}
	}

	const handleLineLogin = async () => {
		setIsLoading(true)
		updateLoading(true)
		try {
			await signIn.social({
				provider: "line",
				callbackURL: "/",
			})
		}
		catch (error) {
			console.error("LINE login error:", error)
			toast.error("An error occurred during LINE login")
			setIsLoading(false)
			updateLoading(false)
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
			<div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-2xl">
				<div className="flex flex-col items-center space-y-2">
					<div className="relative">
						<div className="flex items-center">
							<Image src="/logo-dentshift.png" width={70} height={70} alt="Dentshift Logo" priority unoptimized />
							<h1 className="text-primary-dark text-3xl font-bold">DentShift</h1>
						</div>
					</div>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="email" className="text-sm font-medium text-gray-700">
							Email Address
						</Label>
						<Input
							id="email"
							type="email"
							placeholder="you@example.com"
							{...register("email")}
							className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
							disabled={isLoading}
						/>
						{errors.email && (
							<p className="text-destructive text-sm">{errors.email.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="password" className="text-sm font-medium text-gray-700">
							Password
						</Label>
						<Input
							id="password"
							type="password"
							placeholder="Enter your password"
							{...register("password")}
							className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
							disabled={isLoading}
						/>
						{errors.password && (
							<p className="text-destructive text-sm">{errors.password.message}</p>
						)}
					</div>

					<Button
						variant="default"
						type="submit"
						disabled={isLoading}
						className="w-full"
					>
						{isLoading ? "Signing in..." : "Sign In"}
					</Button>
				</form>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="text-muted-foreground bg-white px-2">
							Or continue with
						</span>
					</div>
				</div>

				<Button
					variant="outline"
					type="button"
					disabled={isLoading}
					onClick={handleLineLogin}
					className="w-full"
				>
					<Icon icon="simple-icons:line" className="mr-2 size-5" style={{ color: "#00B900" }} />
					Sign in with LINE
				</Button>
			</div>
		</div>
	)
}
