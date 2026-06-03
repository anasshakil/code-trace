export type MultiSelectionMode = "primary" | "perSelection" | "span";

export interface SelectionRange {
	startLine: number;
	startCharacter: number;
	endLine: number;
	endCharacter: number;
	isEmpty: boolean;
}

export interface BuildReferenceInput {
	relativePath: string | null;
	selections: SelectionRange[];
	mode: MultiSelectionMode;
}

function formatLines(
	rel: string,
	startLine0: number,
	endLine0: number,
): string {
	const start = startLine0 + 1;
	const end = endLine0 + 1;
	if (start === end) return `${rel}:${start}`;
	return `${rel}:${start}-${end}`;
}

function formatOne(rel: string, sel: SelectionRange): string {
	if (sel.isEmpty) return rel;
	let endLine = sel.endLine;
	if (sel.endCharacter === 0 && sel.endLine > sel.startLine) {
		endLine -= 1;
	}
	return formatLines(rel, sel.startLine, endLine);
}

export function buildReference(input: BuildReferenceInput): string | null {
	const { relativePath, selections, mode } = input;
	if (relativePath === null) return null;

	const rel = relativePath;

	if (mode === "primary") {
		const sel = selections[0];
		if (sel === undefined) return rel;
		return formatOne(rel, sel);
	}

	if (mode === "perSelection") {
		const nonEmpty = selections.filter((s) => !s.isEmpty);
		if (nonEmpty.length === 0) return rel;
		const sorted = [...nonEmpty].sort((a, b) => a.startLine - b.startLine);
		return sorted.map((s) => formatOne(rel, s)).join("\n");
	}

	// span
	const nonEmpty = selections.filter((s) => !s.isEmpty);
	if (nonEmpty.length === 0) return rel;
	const minStart = Math.min(...nonEmpty.map((s) => s.startLine));
	const maxEnd = Math.max(
		...nonEmpty.map((s) => {
			let endLine = s.endLine;
			if (s.endCharacter === 0 && s.endLine > s.startLine) endLine -= 1;
			return endLine;
		}),
	);
	return formatLines(rel, minStart, maxEnd);
}
