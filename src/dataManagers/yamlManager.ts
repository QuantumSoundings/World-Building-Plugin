import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import { parse, stringify } from "yaml";

export class YAMLManager {
    yamlFileCache: Map<string, unknown[]>;
    plugin: WorldBuildingPlugin;

    constructor(plugin: WorldBuildingPlugin) {
        this.yamlFileCache = new Map<string, unknown[]>();
        this.plugin = plugin;
    }

    public async load() {
        await this.reloadAndCacheYAMLFiles();
        this.configureReloadEvents();
    }

    public async reload() {
        await this.reloadAndCacheYAMLFiles();
    }

    public async unload() {
        this.invalidateCache();
    }

    private invalidateCache() {
        this.yamlFileCache.clear();
    }

    public writeFile<Content>(path: string, fileName:string, extension: string, content: Content) {
        if (extension === 'yaml' || extension === 'yml') {
            this.plugin.adapter.write(path + '/' + fileName + '.' + extension, stringify(content));
        }
        else if (extension === 'md') {
            const stringified =  "---\n" + stringify(content) + "\n---\n";
            this.plugin.adapter.write(path + '/' + fileName + '.' + extension, stringified);
        }
        else {
            console.error("Invalid file extension.");
        }
    }

    public getYAMLData(fileName: string): any | undefined{
        const data = this.yamlFileCache.get(fileName);
        if (data === undefined) {
            console.error("Cache did not contain this file.");
            return undefined;
        }
        return data;
    }

    private async reloadAndCacheYAMLFiles() {
        this.invalidateCache();
        console.log("Loading YAML files from data directory.");
        const fileList: string[] = (await this.plugin.adapter.list(this.plugin.settings.dataDirectory)).files;
        let loadedFiles = 0;
        for (const file of fileList) {
            if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                const file_name = file.split('/').slice(-1)[0];
                const content = await this.plugin.adapter.read(file);
                const parsed = parse(content);
                this.yamlFileCache.set(file_name, parsed);
                loadedFiles = loadedFiles + 1;
            }
            else if (file.endsWith('.md')) {
                const file_name = file.split('/').slice(-1)[0];
                const content = await this.plugin.adapter.read(file);
                const lines = content.split('\n');
                const yamlLines = [];
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].startsWith('---')) {
                        break;
                    }
                    yamlLines.push(lines[i]);
                }
                const yamlContent = yamlLines.join('\n');
                const parsed = parse(yamlContent);
                this.yamlFileCache.set(file_name, parsed);
                loadedFiles = loadedFiles + 1;
            }
            else {
                continue;
            }
        }

        console.info('Found and cached ' + loadedFiles + ' YAML files.');
	}

    private configureReloadEvents() {
        const reloadFunction = async (file: TAbstractFile) => {
			if (file.path.includes(this.plugin.settings.dataDirectory)) {
				await this.reload();
                this.plugin.refreshAPIs();
			}
		}
		this.plugin.registerEvent(this.plugin.app.vault.on('create', reloadFunction));
		this.plugin.registerEvent(this.plugin.app.vault.on('delete', reloadFunction));
		this.plugin.registerEvent(this.plugin.app.vault.on('modify', reloadFunction));
		this.plugin.registerEvent(this.plugin.app.vault.on('rename', reloadFunction));
    }
}