/** Normalize a path to POSIX separators and strip a leading `./`. */
export function toPosix(p: string): string {
	const s = p.replace(/\\/g, "/");
	return s.startsWith("./") ? s.slice(2) : s;
}
