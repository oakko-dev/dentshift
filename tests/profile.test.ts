import assert from "node:assert/strict"
// eslint-disable-next-line test/no-import-node-test
import { describe, it } from "node:test"
import { normalizeThaiPhone, shouldRequireProfileCompletion } from "@/lib/profile"

describe("shouldRequireProfileCompletion", () => {
	it("only gates incomplete credential users", () => {
		assert.equal(shouldRequireProfileCompletion(false, true), true)
		assert.equal(shouldRequireProfileCompletion(true, true), false)
		assert.equal(shouldRequireProfileCompletion(false, false), false)
	})
})

describe("normalizeThaiPhone", () => {
	it("normalizes Thai local mobile numbers", () => {
		assert.equal(normalizeThaiPhone("081-234-5678"), "+66812345678")
		assert.equal(normalizeThaiPhone("0912345678"), "+66912345678")
		assert.equal(normalizeThaiPhone("061 234 5678"), "+66612345678")
	})

	it("accepts +66 numbers and formatting separators", () => {
		assert.equal(normalizeThaiPhone("+66 81-234-5678"), "+66812345678")
	})

	it("rejects invalid or non-mobile numbers", () => {
		assert.throws(() => normalizeThaiPhone("021234567"), /Invalid Thai phone number/)
		assert.throws(() => normalizeThaiPhone("+6681234567"), /Invalid Thai phone number/)
	})
})
