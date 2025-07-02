

```ts
import { TFile, TFolder, WorkspaceLeaf, getAllTags } from "obsidian";
import PKPlugin from "../main";

enum NewPaneDirection {
	vertical = "vertical",
	horizontal = "horizontal",
	default = "vertical",
}

interface OpenFileOptions {
	newPane?: boolean;
	direction?: NewPaneDirection;
	mode?: string;
	focus?: boolean;
}

class Obs {
	pkplugin: PKPlugin;
	utils: any;

	constructor(pkplugin: PKPlugin) {
		this.pkplugin = pkplugin;
		this.utils = pkplugin.pklib.utils;
	}

	switchMode = async (mode: string) => {
		const leaf = this.pkplugin.app.workspace.activeLeaf;
		if (!leaf) return;

		const viewState = leaf.getViewState();
		const needSwitch = viewState.state.mode != mode;

		if (needSwitch) {
			viewState.state.mode = mode;
			await leaf.setViewState(viewState);
			await this.utils.g.timeout(200);
		}

		return needSwitch;
	};

	async write(path: string, content: string) {
		const { vault } = this.pkplugin.app;
		const tfile = vault.getAbstractFileByPath(path);
		if (tfile instanceof TFile) vault.delete(tfile);
		if (tfile instanceof TFolder) return false;
		await vault.create(path, content);
	}

	async openFile(
		file: TFile,
		{
			mode,
			focus = true,
			newPane,
			direction = NewPaneDirection.default,
		}: OpenFileOptions = {}
	): Promise<WorkspaceLeaf> {
		const leaf = newPane
			? window.app.workspace.splitActiveLeaf(direction)
			: window.app.workspace.getUnpinnedLeaf();

		if (mode) {
			const viewState = leaf.getViewState();
			viewState.state.mode = mode;
			await leaf.setViewState(viewState, { focus });
		}

		await leaf.openFile(file);
		return leaf;
	}

	getFile(path: TFile | string): TFile | false {
		if (path instanceof TFile) return path;
		const tfile = this.pkplugin.app.vault.getAbstractFileByPath(path);
		if (tfile instanceof TFile) return tfile;
		return false;
	}

	getAllNotes = () => {
		console.log("getall");
	};

	getAttachementsFolder = () => {
		const { vault } = this.pkplugin.app;
		// @ts-ignore
		return vault.config.attachmentFolderPath;
	};

	getFrontmatter(path: TFile | string) {
		const file = this.getFile(path);
		const fm = file
			? {
					...this.pkplugin.app.metadataCache.getFileCache(file)
						?.frontmatter,
			  }
			: {};
		delete fm.position;
		return fm;
	}

	getTags(path: TFile | string) {
		const file = this.getFile(path);
		if (!file) return [];
		const metafile = this.pkplugin.app.metadataCache.getFileCache(file);
		const tags: string[] = metafile
			? this.utils.a.unique(getAllTags(metafile))
			: [];

		tags.forEach((tag: string, index) => {
			tags[index] = tag.replace("#", "");
		});
		return tags;
	}

	// TODO: finish the implementation
	getBacklinks(path: TFile | string) {
		// const file = this.getFile(path);
		// if (!file) return [];
		// const metafile =
		// 	this.pkplugin.app.metadataCache.getBacklinksForFile(file);
		const links: string[] = []; // metafile
		// console.log("GETBACKLINKS", metafile)
		// return clean version of metafile
		return links;
	}

	updateFrontmatter(contents: string, field: string, value: any) {
		const f = contents.match(/^---\r?\n(.*?)\n---\r?\n(.*)$/s),
			v = `${field}: ${value}`,
			x = new RegExp(`^${field}:.*$`, "m"),
			[s, e] = f ? [`${f[1]}\n`, f[2]] : ["", contents];
		return f && f[1].match(x)
			? contents.replace(x, v)
			: `---\n${s}${v}\n---\n${e}`;
	}
}

export default Obs;

```


