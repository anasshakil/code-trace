import assert from "node:assert/strict";
import { test } from "node:test";

import type { ResultRow } from "@/parseReference";
import { clampLineRange, dirOf, formatItem, looksLikeRefs } from "@/openModel";

const row = (overrides: Partial<ResultRow> = {}): ResultRow => ({
	kind: "single",
	path: "src/foo.ts",
	ranges: [{ start: 10, end: 20 }],
	label: "foo.ts:10-20",
	raw: "src/foo.ts:10-20",
	...overrides,
});

test("looksLikeRefs — newline", () => {
	assert.equal(looksLikeRefs("a.ts:1\nb.ts:2"), true);
});

test("looksLikeRefs — path:line token", () => {
	assert.equal(looksLikeRefs("src/foo.ts:100"), true);
});

test("looksLikeRefs — path with extension", () => {
	assert.equal(looksLikeRefs("src/foo.ts"), true);
});

test("looksLikeRefs — plain filter text", () => {
	assert.equal(looksLikeRefs("hello"), false);
});

test("dirOf — nested path", () => {
	assert.equal(dirOf("src/lib/foo.ts"), "src/lib");
});

test("dirOf — bare filename", () => {
	assert.equal(dirOf("foo.ts"), "");
});

test("formatItem — invalid", () => {
	const r = row({ kind: "invalid", label: "junk", raw: "junk" });
	assert.deepEqual(formatItem(r, "invalid", ""), {
		label: "$(error) junk",
		description: "unrecognized",
	});
});

test("formatItem — not found without dir", () => {
	const r = row({ label: "foo.ts:10-20" });
	assert.deepEqual(formatItem(r, "notFound", ""), {
		label: "$(warning) foo.ts:10-20",
		description: "not found",
	});
});

test("formatItem — not found with dir", () => {
	const r = row({ path: "src/lib/foo.ts", label: "foo.ts:10-20" });
	assert.deepEqual(formatItem(r, "notFound", "src/lib"), {
		label: "$(warning) foo.ts:10-20",
		description: "src/lib — not found",
	});
});

test("formatItem — found single", () => {
	const r = row({ kind: "single" });
	assert.deepEqual(formatItem(r, "found", "src"), {
		label: "$(file) foo.ts:10-20",
		description: "src",
	});
});

test("formatItem — found aggregate", () => {
	const r = row({
		kind: "aggregate",
		label: "foo.ts (2 selections)",
	});
	assert.deepEqual(formatItem(r, "found", "src"), {
		label: "$(symbol-array) foo.ts (2 selections)",
		description: "src",
	});
});

test("clampLineRange — normal", () => {
	assert.deepEqual(clampLineRange(10, 20, 99), { startLine: 9, endLine: 19 });
});

test("clampLineRange — below 1 clamps to 0", () => {
	assert.deepEqual(clampLineRange(0, 5, 99), { startLine: 0, endLine: 4 });
});

test("clampLineRange — above last clamps to last", () => {
	assert.deepEqual(clampLineRange(200, 300, 99), {
		startLine: 99,
		endLine: 99,
	});
});

test("clampLineRange — reversed still clamps each bound", () => {
	assert.deepEqual(clampLineRange(120, 100, 99), {
		startLine: 99,
		endLine: 99,
	});
});
