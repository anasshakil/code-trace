import type { ExtensionContext } from "vscode";

import { registerCopyCommand } from "@/commands/copy";
import { registerOpenCommand } from "@/commands/open";

export function activate(context: ExtensionContext): void {
	context.subscriptions.push(
		registerCopyCommand(),
		registerOpenCommand(context),
	);
}

export function deactivate(): void {}
