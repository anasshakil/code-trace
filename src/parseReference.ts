export type GroupingMode = "aggregate" | "aggregateAndRange" | "range";

export interface LineRef {
	/** Original token as parsed. */
	raw: string;
	/** Workspace-relative path (POSIX-ish, as copied). */
	path: string;
	/** 1-based start line, undefined for a bare path. */
	start?: number;
	/** 1-based inclusive end line, undefined for a bare path. */
	end?: number;
	/** Looks like a real file reference (has separator or line numbers). */
	valid: boolean;
}

export interface RefRange {
	/** 1-based start line. */
	start: number;
	/** 1-based inclusive end line. */
	end: number;
}

export type RowKind = "single" | "aggregate" | "invalid";

export interface ResultRow {
	kind: RowKind;
	path: string;
	/** Ranges to select; empty means open file with no selection. */
	ranges: RefRange[];
	/** Display label, e.g. "hello.ts:100-120" or "foo.ts". */
	label: string;
	/** Raw source text for invalid rows. */
	raw: string;
}

// token -> path[:start[-end]]. Lazy path so trailing :line is split off.
const TOKEN_RE = /^(.+?)(?::(\d+)(?:-(\d+))?)?$/;

function looksLikePath(path: string, hasLine: boolean): boolean {
	if (hasLine) return true;
	return /[./\\]/.test(path);
}

function basename(path: string): string {
	const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
	return i >= 0 ? path.slice(i + 1) : path;
}

function lineLabel(path: string, start?: number, end?: number): string {
	const base = basename(path);
	if (start === undefined) return base;
	if (end === undefined || end === start) return `${base}:${start}`;
	return `${base}:${start}-${end}`;
}

/**
 * Parse clipboard / pasted text into line references.
 * Splits on newlines and whitespace (paths with spaces unsupported).
 */
export function parseReferences(text: string): LineRef[] {
	const tokens = text
		.split(/[\r\n]+/)
		.flatMap((line) => line.split(/\s+/))
		.map((t) => t.trim())
		.filter(Boolean);

	const refs: LineRef[] = [];
	for (const token of tokens) {
		const m = TOKEN_RE.exec(token);
		if (m === null) {
			refs.push({ raw: token, path: token, valid: false });
			continue;
		}
		const path = m[1] ?? token;
		const start = m[2] !== undefined ? Number(m[2]) : undefined;
		let end = m[3] !== undefined ? Number(m[3]) : undefined;
		// normalize reversed ranges (e.g. 120-100)
		if (start !== undefined && end !== undefined && end < start) {
			const tmp = end;
			end = start;
			refs.push({ raw: token, path, start: tmp, end, valid: true });
			continue;
		}
		const valid = looksLikePath(path, start !== undefined);
		refs.push({ raw: token, path, start, end, valid });
	}
	return refs;
}

function refRange(ref: LineRef): RefRange | null {
	if (ref.start === undefined) return null;
	return { start: ref.start, end: ref.end ?? ref.start };
}

/**
 * Group parsed refs into display rows per grouping mode.
 * Invalid refs only surface when `includeInvalid` is set (verbose parsing).
 */
export function groupReferences(
	refs: LineRef[],
	mode: GroupingMode,
	includeInvalid: boolean,
): ResultRow[] {
	const rows: ResultRow[] = [];

	if (mode === "range") {
		for (const ref of refs) {
			if (!ref.valid) {
				if (includeInvalid)
					rows.push({
						kind: "invalid",
						path: ref.path,
						ranges: [],
						label: ref.raw,
						raw: ref.raw,
					});
				continue;
			}
			const r = refRange(ref);
			rows.push({
				kind: "single",
				path: ref.path,
				ranges: r ? [r] : [],
				label: lineLabel(ref.path, ref.start, ref.end),
				raw: ref.raw,
			});
		}
		return rows;
	}

	// aggregate / aggregateAndRange: group valid refs by path, first-seen order
	const order: string[] = [];
	const byPath = new Map<string, LineRef[]>();
	for (const ref of refs) {
		if (!ref.valid) {
			if (includeInvalid)
				rows.push({
					kind: "invalid",
					path: ref.path,
					ranges: [],
					label: ref.raw,
					raw: ref.raw,
				});
			continue;
		}
		const list = byPath.get(ref.path);
		if (list === undefined) {
			order.push(ref.path);
			byPath.set(ref.path, [ref]);
		} else {
			list.push(ref);
		}
	}

	for (const path of order) {
		const list = byPath.get(path) ?? [];
		const ranges = list.map(refRange).filter((r): r is RefRange => r !== null);

		if (ranges.length <= 1) {
			// single ref (or bare path) — one plain row
			const only = list[0];
			rows.push({
				kind: "single",
				path,
				ranges,
				label: lineLabel(path, only?.start, only?.end),
				raw: only?.raw ?? path,
			});
			continue;
		}

		// 2+ ranges in same file
		const aggLabel = `${basename(path)} (${ranges.length} selections)`;
		rows.push({
			kind: "aggregate",
			path,
			ranges,
			label: aggLabel,
			raw: path,
		});

		if (mode === "aggregateAndRange") {
			for (const ref of list) {
				const r = refRange(ref);
				rows.push({
					kind: "single",
					path,
					ranges: r ? [r] : [],
					label: lineLabel(path, ref.start, ref.end),
					raw: ref.raw,
				});
			}
		}
	}

	return rows;
}
