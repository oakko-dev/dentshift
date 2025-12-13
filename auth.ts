import { compare, hash } from "bcryptjs"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { customSession } from "better-auth/plugins"
import prisma from "@/lib/prisma"

export const auth = betterAuth({
	plugins: [
		customSession(async ({ user, session }) => {
			const account = await prisma.accounts.findFirst({
				where: {
					userId: user.id,
				},
				select: {
					providerId: true,
					user: {
						select: {
							firstname: true,
							lastname: true,
						},
					},
				},
			})

			return {
				user: {
					...user,
					provider: account?.user,
					providerId: account?.providerId,
					firstname: account?.user?.firstname,
					lastname: account?.user?.lastname,
				},
				session,
			}
		}),
	],
	user: {
		modelName: "users",
		fields: {
			email: "email",
		},
		additionalFields: {
			firstname: {
				type: "string",
				required: false,
			},
			lastname: {
				type: "string",
				required: false,
			},
		},
	},
	account: {
		modelName: "accounts",
		fields: {
			accessTokenExpiresAt: "expiresAt",
		},
		skipStateCookieCheck: true,
		accountLinking: {
			enabled: true,
			trustedProviders: ["line", "email-password"],

		},
	},
	session: {
		modelName: "sessions",
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
	},
	verification: {
		modelName: "verifications",
	},
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	advanced: {
		database: {
			generateId: false, // Prevents Better Auth from generating IDs
		},
	},
	databaseHooks: {
		account: {
			create: {
				before: async (account) => {
					return {
						data: {
							...account,
							scope: undefined,
						},
					}
				},
			},
			update: {
				before: async (account) => {
					return {
						data: {
							...account,
							scope: undefined,
						},
					}
				},
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		password: {
			hash: (password: string) => hash(password, 12),
			verify: (data: { password: string, hash: string }) => compare(data.password, data.hash),
		},
	},
	socialProviders: {
		line: {
			clientId: process.env.LINE_CLIENT_ID as string,
			clientSecret: process.env.LINE_CLIENT_SECRET as string,
		},
	},
})
