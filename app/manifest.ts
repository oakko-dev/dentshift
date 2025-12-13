import type { MetadataRoute } from "next"

function getBaseUrl(): string {
	// In production, use the configured app URL or Vercel URL
	if (process.env.NEXT_PUBLIC_APP_URL) {
		return process.env.NEXT_PUBLIC_APP_URL
	}

	// Vercel automatically sets VERCEL_URL for deployments
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`
	}

	// Fallback for local development
	return process.env.NODE_ENV === "production"
		? "https://dentshift.vercel.app"
		: "http://localhost:3000"
}

export default function manifest(): MetadataRoute.Manifest {
	const baseUrl = getBaseUrl()

	return {
		name: "DentShift",
		short_name: "DentShift",
		description: "DentShift is a web application for managing your dental practice",
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#ffffff",
		orientation: "portrait",
		lang: "en-US",
		scope: "/",
		id: "/",
		icons: [
			{
				src: `${baseUrl}/icons/icon-48x48.png`,
				sizes: "48x48",
				type: "image/png",
			},
			{
				src: `${baseUrl}/icons/icon-72x72.png`,
				sizes: "72x72",
				type: "image/png",
			},
			{
				src: `${baseUrl}/icons/icon-96x96.png`,
				sizes: "96x96",
				type: "image/png",
			},
			{
				src: `${baseUrl}/icons/icon-128x128.png`,
				sizes: "128x128",
				type: "image/png",
			},
			{
				src: `${baseUrl}/icons/icon-144x144.png`,
				sizes: "144x144",
				type: "image/png",
			},
			{
				src: `${baseUrl}/icons/icon-152x152.png`,
				sizes: "152x152",
				type: "image/png",
			},
			{
				src: `${baseUrl}/icons/icon-192x192.png`,
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: `${baseUrl}/icons/icon-256x256.png`,
				sizes: "256x256",
				type: "image/png",
			},
			{
				src: `${baseUrl}/icons/icon-384x384.png`,
				sizes: "384x384",
				type: "image/png",
			},
			{
				src: `${baseUrl}/icons/icon-512x512.png`,
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
		],
	}
}
