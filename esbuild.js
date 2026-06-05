const path = require("node:path");

const esbuild = require("esbuild");

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");

/** @type {import("esbuild").Plugin} */
const aliasPlugin = {
	name: "alias",
	setup(build) {
		build.onResolve({ filter: /^@\// }, (args) => ({
			path: path.resolve(__dirname, "src", `${args.path.slice(2)}.ts`),
		}));
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: ["src/extension.ts"],
		bundle: true,
		format: "cjs",
		platform: "node",
		target: "node18",
		outfile: "dist/extension.js",
		external: ["vscode"],
		minify: production,
		sourcemap: !production,
		logLevel: "info",
		plugins: [aliasPlugin],
	});
	if (watch) await ctx.watch();
	else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}
main().catch((e) => {
	console.error(e);
	process.exit(1);
});
