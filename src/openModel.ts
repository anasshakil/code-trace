import type { ResultRow } from "@/parseReference";

export type ItemState = "invalid" | "notFound" | "found";

/** True when pasted/typed text looks like code references rather than a filter query. */
export function looksLikeRefs(value: string): boolean {
	if (/[\r\n]/.test(value)) return true;
	// any token shaped like path:line, or a path with an extension
	return /\S+:\d+/.test(value) || /\S+\.\w+/.test(value);
}

/** Parent directory of a POSIX-ish path, or empty when there is no separator. */
export function dirOf(path: string): string {
	return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
}

/** QuickPick label and description for a parsed row. */
export function formatItem(
	row: ResultRow,
	state: ItemState,
	dir: string,
): { icon: string; label: string; description: string } {
	if (state === "invalid") {
		return {
			icon: "$(error)",
			label: row.label,
			description: "unrecognized",
		};
	}

	if (state === "notFound") {
		return {
			icon: "$(warning)",
			label: row.label,
			description: dir ? `${dir} — not found` : "not found",
		};
	}

	const icon = row.kind === "aggregate" ? "$(symbol-array)" : "$(file)";

	return {
		icon,
		label: row.label,
		description: dir,
	};
}

/** Clamp 1-based inclusive line numbers to 0-based indices within [0, last]. */
export function clampLineRange(
	start: number,
	end: number,
	last: number,
): { startLine: number; endLine: number } {
	return {
		startLine: Math.min(Math.max(start - 1, 0), last),
		endLine: Math.min(Math.max(end - 1, 0), last),
	};
}
