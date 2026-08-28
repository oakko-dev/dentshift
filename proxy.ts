import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

const publicPaths = ["/login", "/api/auth"]

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl
	const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
	const sessionCookie = getSessionCookie(request)

	if (!isPublicPath && !sessionCookie) {
		const loginUrl = new URL("/login", request.url)
		return NextResponse.redirect(loginUrl)
	}

	if (sessionCookie && pathname !== "/profile/complete" && !pathname.startsWith("/api/profile")) {
		const session = await auth.api.getSession({ headers: request.headers })
		if (session?.user?.id) {
			const [user, credential] = await Promise.all([
				prisma.users.findUnique({ where: { id: session.user.id }, select: { profileCompleted: true } }),
				prisma.accounts.findFirst({ where: { userId: session.user.id, providerId: "credential", password: { not: null } }, select: { id: true } }),
			])
			if (credential && user && !user.profileCompleted) {
				return NextResponse.redirect(new URL("/profile/complete", request.url))
			}
		}
	}

	if (pathname === "/login" && sessionCookie) {
		const homeUrl = new URL("/", request.url)
		return NextResponse.redirect(homeUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
	],
}
