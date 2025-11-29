import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const sweetalert = withReactContent(Swal)

export const swal = sweetalert.mixin({
	allowOutsideClick: false,
	buttonsStyling: false,
	reverseButtons: true,
	confirmButtonText: "ตกลง",
	cancelButtonText: "ยกเลิก",
	denyButtonText: "ไม่ใช่",
	customClass: {
		popup: "!rounded-2xl !pb-10",
		title: "!text-2xl font-semibold",
		htmlContainer: "!text-base !text-subdude",
		actions: "flex justify-center items-center gap-x-4",
		cancelButton:
			"flex justify-center items-center rounded-[10px] px-4 py-2 min-w-[75px] gap-x-1 text-foreground border bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary-hover hover:cursor-pointer",
		confirmButton:
			"flex justify-center items-center rounded-[10px] px-4 py-2 min-w-[75px] gap-x-1 text-white bg-primary hover:bg-primary-dark hover:cursor-pointer",
		denyButton:
			"flex justify-center items-center rounded-[10px] px-4 py-2 min-w-[75px] gap-x-1 text-red border border-destructive hover:bg-destructive hover:text-white hover:cursor-pointer",
	},
})

// swal.fire({
// 	icon: "info",
// 	title: "เข้าสู่ระบบ",
// 	text: "กรุณาเข้าสู่ระบบเพื่อใช้งานระบบ",
// 	showCancelButton: true,
// 	showConfirmButton: true,
// })

// swal.fire({
// 	icon: 'error',
// 	title: error.response.data.error,
// 	html: error.response.data.hint?.join(' '),
// })

// swal.fire({
// 	icon: 'success',
// 	title: t("password-successfully-reset"),
// }).then(async (result) => {
// 	if (result.isConfirmed) {
// 		lscache.remove('fptoken')
// 		push('/login')
// 	}
// })
