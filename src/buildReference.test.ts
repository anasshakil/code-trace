import assert from "node:assert/strict";
import { test } from "node:test";

import { buildReference, type SelectionRange } from "@/buildReference";

const empty = (line: number): SelectionRange => ({
	startLine: line,
	startCharacter: 0,
	endLine: line,
	endCharacter: 0,
	isEmpty: true,
});

const sel = (
	sl: number,
	sc: number,
	el: number,
	ec: number,
): SelectionRange => ({
	startLine: sl,
	startCharacter: sc,
	endLine: el,
	endCharacter: ec,
	isEmpty: sl === el && sc === ec,
});

test("no selection → bare path", () => {
	assert.equal(
		buildReference({
			relativePath: "src/hello.ts",
			selections: [empty(99)],
			mode: "primary",
		}),
		"src/hello.ts",
	);
});

test("single-line selection → :100", () => {
	assert.equal(
		buildReference({
			relativePath: "src/hello.ts",
			selections: [sel(99, 0, 99, 5)],
			mode: "primary",
		}),
		"src/hello.ts:100",
	);
});

test("multi-line selection → :100-120", () => {
	assert.equal(
		buildReference({
			relativePath: "src/hello.ts",
			selections: [sel(99, 0, 119, 10)],
			mode: "primary",
		}),
		"src/hello.ts:100-120",
	);
});

test("column-0 off-by-one fix", () => {
	assert.equal(
		buildReference({
			relativePath: "src/hello.ts",
			selections: [sel(99, 0, 120, 0)],
			mode: "primary",
		}),
		"src/hello.ts:100-120",
	);
});

test("primary mode uses selections[0] only", () => {
	assert.equal(
		buildReference({
			relativePath: "src/hello.ts",
			selections: [sel(99, 0, 99, 5), sel(149, 0, 159, 0)],
			mode: "primary",
		}),
		"src/hello.ts:100",
	);
});

test("perSelection → newline-joined ascending", () => {
	assert.equal(
		buildReference({
			relativePath: "src/hello.ts",
			selections: [sel(149, 0, 159, 0), sel(99, 0, 109, 0)],
			mode: "perSelection",
		}),
		"src/hello.ts:100-109\nsrc/hello.ts:150-159",
	);
});

test("span → min-max single range", () => {
	assert.equal(
		buildReference({
			relativePath: "src/hello.ts",
			selections: [sel(99, 0, 109, 0), sel(149, 0, 159, 0)],
			mode: "span",
		}),
		"src/hello.ts:100-159",
	);
});

test("multi-root prefix passthrough", () => {
	assert.equal(
		buildReference({
			relativePath: "frontend/src/hello.ts",
			selections: [sel(99, 0, 99, 5)],
			mode: "primary",
		}),
		"frontend/src/hello.ts:100",
	);
});

test("unsaved file → null", () => {
	assert.equal(
		buildReference({
			relativePath: null,
			selections: [empty(0)],
			mode: "primary",
		}),
		null,
	);
});
