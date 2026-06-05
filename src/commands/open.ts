import * as vscode from "vscode";

import type { GroupingMode, ResultRow } from "@/parseReference";
import { clampLineRange, dirOf, formatItem, looksLikeRefs } from "@/openModel";
import { groupReferences, parseReferences } from "@/parseReference";

type OpenSource = "auto" | "paste";
type ParsingMode = "tolerant" | "tolerantVerbose";
type BoxBehavior = "smartReparse" | "autoFilterPasteParse" | "alwaysParse";
type RowAction = "preview" | "noAction";

interface RowItem extends vscode.QuickPickItem {
	row?: ResultRow;
	uri?: vscode.Uri;
}

// resourceUri icon-derivation from file icon theme requires VSCode 1.106+
const supportsFileTypeIcon = (() => {
	const parts = vscode.version.split(".").map(Number);
	const maj = parts[0] ?? 0;
	const min = parts[1] ?? 0;
	return maj > 1 || (maj === 1 && min >= 106);
})();

function themeIconFrom(codicon: string): vscode.ThemeIcon {
	return new vscode.ThemeIcon(codicon.replace(/^\$\(|\)$/g, ""));
}

function withFileIcon(item: RowItem, resourceUri: vscode.Uri): RowItem {
	return { ...item, iconPath: vscode.ThemeIcon.File, resourceUri };
}

/** Resolve a workspace-relative path to a real file across all roots. */
async function resolvePath(rel: string): Promise<vscode.Uri | null> {
	const folders = vscode.workspace.workspaceFolders ?? [];
	for (const folder of folders) {
		const candidate = vscode.Uri.joinPath(folder.uri, rel);
		try {
			const stat = await vscode.workspace.fs.stat(candidate);
			if (stat.type & vscode.FileType.File) return candidate;
		} catch {
			// not in this root — try next
		}
	}
	return null;
}

async function buildItems(
	text: string,
	grouping: GroupingMode,
	verbose: boolean,
	cache: Map<string, vscode.Uri | null>,
): Promise<RowItem[]> {
	const refs = parseReferences(text);
	const rows = groupReferences(refs, grouping, verbose);

	const items: RowItem[] = [];
	for (const row of rows) {
		if (row.kind === "invalid") {
			const { icon, label, description } = formatItem(row, "invalid", "");
			items.push({ label, description, row, iconPath: themeIconFrom(icon) });
			continue;
		}

		let uri = cache.get(row.path);
		if (uri === undefined) {
			uri = await resolvePath(row.path);
			cache.set(row.path, uri);
		}

		const dir = dirOf(row.path);

		if (uri === null) {
			const { icon, label, description } = formatItem(row, "notFound", dir);
			items.push({ label, description, row, iconPath: themeIconFrom(icon) });
			continue;
		}

		const { icon, label, description } = formatItem(row, "found", dir);
		items.push(
			supportsFileTypeIcon
				? withFileIcon({ label, description, row, uri }, uri)
				: { label, description, row, uri, iconPath: themeIconFrom(icon) },
		);
	}
	return items;
}

/** Build editor selections (0-based) from 1-based inclusive ranges. */
function buildSelections(
	doc: vscode.TextDocument,
	row: ResultRow,
): vscode.Selection[] {
	const last = doc.lineCount - 1;
	return row.ranges.map((r) => {
		const { startLine, endLine } = clampLineRange(r.start, r.end, last);
		const endCol = doc.lineAt(endLine).range.end.character;
		return new vscode.Selection(startLine, 0, endLine, endCol);
	});
}

async function revealRow(
	item: RowItem,
	preview: boolean,
): Promise<vscode.TextEditor | null> {
	if (item.uri === undefined || item.row === undefined) return null;
	const doc = await vscode.workspace.openTextDocument(item.uri);
	const editor = await vscode.window.showTextDocument(doc, {
		preview,
		preserveFocus: preview,
	});
	if (item.row.ranges.length > 0) {
		const selections = buildSelections(doc, item.row);
		const primary = selections[0];
		if (primary !== undefined) {
			editor.selections = selections;
			editor.revealRange(primary, vscode.TextEditorRevealType.InCenter);
		}
	}
	return editor;
}

async function openReference(): Promise<void> {
	const cfg = vscode.workspace.getConfiguration("codeTrace");
	const source = cfg.get<OpenSource>("openSource", "auto");
	const grouping = cfg.get<GroupingMode>("openGrouping", "aggregate");
	const parsing = cfg.get<ParsingMode>("openParsing", "tolerant");
	const box = cfg.get<BoxBehavior>("openBoxBehavior", "smartReparse");
	const rowAction = cfg.get<RowAction>("openRowAction", "preview");

	const verbose = parsing === "tolerantVerbose";

	const cache = new Map<string, vscode.Uri | null>();
	const restore = vscode.window.activeTextEditor;

	const qp = vscode.window.createQuickPick<RowItem>();

	qp.placeholder = "Paste code references (e.g. src/hello.ts:1-10)…";
	qp.matchOnDescription = true;

	let accepted = false;
	let seq = 0;

	const refresh = async (text: string): Promise<void> => {
		const mySeq = ++seq;
		qp.busy = true;
		const items = await buildItems(text, grouping, verbose, cache);
		if (mySeq === seq) qp.items = items;
		qp.busy = false;
	};

	if (source === "auto") {
		const clip = await vscode.env.clipboard.readText();
		if (clip.trim().length > 0) await refresh(clip);
	}

	let updating = false;
	qp.onDidChangeValue((value) => {
		if (updating) return;
		const treatAsRefs =
			box === "alwaysParse" ||
			(box === "smartReparse" && looksLikeRefs(value)) ||
			(box === "autoFilterPasteParse" && source === "paste");
		if (!treatAsRefs) return; // let QuickPick fuzzy-filter existing items
		void refresh(value).then(() => {
			updating = true;
			qp.value = "";
			updating = false;
		});
	});

	qp.onDidChangeActive((active) => {
		const item = active[0];
		if (item?.uri !== undefined && rowAction === "preview") {
			void revealRow(item, true);
		}
	});

	qp.onDidAccept(() => {
		const item = qp.selectedItems[0];
		if (item === undefined) return;
		if (item.uri === undefined) {
			vscode.window.showWarningMessage(
				`Code Trace: file not found — ${item.row?.path ?? "?"}`,
			);
			return;
		}
		accepted = true;
		qp.hide();
		void revealRow(item, false);
	});

	qp.onDidHide(() => {
		if (!accepted && restore !== undefined) {
			void vscode.window.showTextDocument(restore.document, {
				viewColumn: restore.viewColumn,
				preview: false,
			});
		}
		qp.dispose();
	});

	qp.show();
}

export function registerOpenCommand(
	_context: vscode.ExtensionContext,
): vscode.Disposable {
	return vscode.commands.registerCommand("codeTrace.open", () =>
		openReference(),
	);
}
