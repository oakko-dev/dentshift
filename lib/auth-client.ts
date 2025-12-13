import { customSessionClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { auth } from "@/auth"

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	plugins: [
		customSessionClient<typeof auth>(),
	],

})

export const { signIn, signOut, signUp, useSession, linkSocial } = authClient
