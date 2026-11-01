import { expect, it, vi } from "vitest";
import { trashLibraryProjects } from "./trashProjects";
it("rejects paths outside the project library before touching files", async () => {
	const trash = vi.fn();
	await expect(
		trashLibraryProjects(["/private/tmp/a.reclyra", "/private/tmp/private.txt"], {
			list: async () => ({ entries: [{ path: "/private/tmp/a.reclyra" }] }),
			trash,
			thumbnailPath: (p) => p + ".png",
		}),
	).rejects.toThrow("not in the library");
	expect(trash).not.toHaveBeenCalled();
});
it("trashes only selected project files, deduplicates paths, and reports partial failures", async () => {
	const trash = vi.fn(async (p: string) => {
		if (p.endsWith("b.reclyra")) throw Error("locked");
	});
	const result = await trashLibraryProjects(
		["/private/tmp/a.reclyra", "/private/tmp/a.reclyra", "/private/tmp/b.reclyra"],
		{
			list: async () => ({
				entries: [{ path: "/private/tmp/a.reclyra" }, { path: "/private/tmp/b.reclyra" }],
			}),
			trash,
			thumbnailPath: (p) => p + ".missing.png",
		},
	);
	expect(result.deleted).toEqual(["/private/tmp/a.reclyra"]);
	expect(result.errors).toEqual(["Could not trash b.reclyra"]);
	expect(trash.mock.calls.map(([p]) => p)).toEqual([
		"/private/tmp/a.reclyra",
		"/private/tmp/b.reclyra",
	]);
});
