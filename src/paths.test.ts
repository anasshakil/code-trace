import assert from "node:assert/strict";
import { test } from "node:test";

import { toPosix } from "@/paths";

test("backslash → slash", () => {
	assert.equal(toPosix("src\\foo\\bar.ts"), "src/foo/bar.ts");
});

test("strip leading ./", () => {
	assert.equal(toPosix("./src/foo.ts"), "src/foo.ts");
});

test("already-posix passthrough", () => {
	assert.equal(toPosix("src/foo.ts"), "src/foo.ts");
});
