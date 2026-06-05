import assert from "node:assert/strict";
import { test } from "node:test";

import {
	groupReferences,
	type LineRef,
	parseReferences,
} from "@/parseReference";

function first(refs: LineRef[]): LineRef {
	const ref = refs[0];
	assert.ok(ref !== undefined, "expected at least one ref");
	return ref;
}

test("parse bare path", () => {
	const ref = first(parseReferences("src/foo.ts"));
	assert.deepEqual(
		{ path: ref.path, start: ref.start, valid: ref.valid },
		{ path: "src/foo.ts", start: undefined, valid: true },
	);
});

test("parse single line", () => {
	const ref = first(parseReferences("src/hello.ts:100"));
	assert.deepEqual(
		[ref.path, ref.start, ref.end],
		["src/hello.ts", 100, undefined],
	);
});

test("parse range", () => {
	const ref = first(parseReferences("src/hello.ts:100-120"));
	assert.deepEqual([ref.path, ref.start, ref.end], ["src/hello.ts", 100, 120]);
});

test("parse reversed range normalizes", () => {
	const ref = first(parseReferences("src/hello.ts:120-100"));
	assert.deepEqual([ref.start, ref.end], [100, 120]);
});

test("split on newlines and whitespace", () => {
	const refs = parseReferences("a.ts:1-2\nb.ts:3   c.ts");
	assert.deepEqual(
		refs.map((r) => r.path),
		["a.ts", "b.ts", "c.ts"],
	);
});

test("invalid token flagged", () => {
	const ref = first(parseReferences("garbage"));
	assert.equal(ref.valid, false);
});

const input = "hello.ts:100-120\nhello.ts:10-60\nfoo.ts";

test("group range mode → row per ref", () => {
	const rows = groupReferences(parseReferences(input), "range", false);
	assert.deepEqual(
		rows.map((r) => r.label),
		["hello.ts:100-120", "hello.ts:10-60", "foo.ts"],
	);
});

test("group aggregate mode → collapse same file", () => {
	const rows = groupReferences(parseReferences(input), "aggregate", false);
	assert.equal(rows.length, 2);
	assert.equal(rows[0]?.kind, "aggregate");
	assert.equal(rows[0]?.ranges.length, 2);
	assert.equal(rows[1]?.label, "foo.ts");
});

test("group aggregateAndRange → aggregate plus individuals", () => {
	const rows = groupReferences(
		parseReferences(input),
		"aggregateAndRange",
		false,
	);
	assert.deepEqual(
		rows.map((r) => r.kind),
		["aggregate", "single", "single", "single"],
	);
});

test("verbose surfaces invalid rows", () => {
	const rows = groupReferences(parseReferences("a.ts:1\njunk"), "range", true);
	assert.equal(
		rows.some((r) => r.kind === "invalid"),
		true,
	);
});

test("non-verbose drops invalid rows", () => {
	const rows = groupReferences(parseReferences("a.ts:1\njunk"), "range", false);
	assert.equal(
		rows.every((r) => r.kind !== "invalid"),
		true,
	);
});
