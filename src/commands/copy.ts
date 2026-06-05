import * as vscode from "vscode";

import type { MultiSelectionMode, SelectionRange } from "@/buildReference";
import { buildReference } from "@/buildReference";
import { toPosix } from "@/paths";

export function registerCopyCommand(): vscode.Disposable {
	return vscode.commands.registerCommand("codeTrace.copy", async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showWarningMessage("Code Trace: no active editor.");
			return;
		}

		const { uri } = editor.document;

		if (editor.document.isUntitled || uri.scheme === "untitled") {
			vscode.window.showWarningMessage(
				"Code Trace: no file path — save the file first.",
			);
			return;
		}

		if (uri.scheme === "vscode-notebook-cell") {
			return;
		}

		const folders = vscode.workspace.workspaceFolders;
		const multiRoot = (folders?.length ?? 0) > 1;
		const rel = vscode.workspace.asRelativePath(uri, multiRoot);
		const relativePath = toPosix(rel);

		const mode = vscode.workspace
			.getConfiguration("codeTrace")
			.get<MultiSelectionMode>("multiSelection", "primary");

		const selections: SelectionRange[] = editor.selections.map((s) => ({
			startLine: s.start.line,
			startCharacter: s.start.character,
			endLine: s.end.line,
			endCharacter: s.end.character,
			isEmpty: s.isEmpty,
		}));

		const result = buildReference({ relativePath, selections, mode });

		if (result === null) {
			vscode.window.showWarningMessage(
				"Code Trace: no file path — save the file first.",
			);
			return;
		}

		await vscode.env.clipboard.writeText(result);
		vscode.window.setStatusBarMessage(
			`Copied: ${result.split("\n")[0]}…`,
			2000,
		);
	});
}
