import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import { parse } from "csv-parse/sync";

export class CSVManager {
    csvFileCache: Map<string, unknown[]>;
    plugin: WorldBuildingPlugin;

    constructor(plugin: WorldBuildingPlugin) {
        this.csvFileCache = new Map<string, unknown[]>();
        this.plugin = plugin;
    }

    public async load() {
        await this.reloadAndCacheCSVFiles();
        this.configureCodeBlockProcessor();
        this.configureReloadEvents();
    }

    public async reload() {
        await this.reloadAndCacheCSVFiles();
    }

    public async unload() {
        this.invalidateCache();
    }

    private invalidateCache() {
        this.csvFileCache.clear();
    }

    public getCSVData(fileName: string): any[] | undefined {
        const data = this.csvFileCache.get(fileName);
        if (data === undefined) {
            console.error("Cache did not contain this file.");
            return undefined;
        }
        return data as any[];
    }

    private async reloadAndCacheCSVFiles() {
        this.invalidateCache();
        console.log("Loading CSV files from data directory.");
        const fileList: string[] = (await this.plugin.adapter.list(this.plugin.settings.dataDirectory)).files;
        let loadedFiles = 0;
        for (const file of fileList) {
            if (!file.endsWith('.csv')) {
                continue;
            }
            const file_name = file.split('/').slice(-1)[0];
            const content = await this.plugin.adapter.read(file);
            const parsed = parse(content);
            this.csvFileCache.set(file_name, parsed);
            loadedFiles = loadedFiles + 1;
        }

        console.info('Found and cached ' + loadedFiles + ' CSV files.');
	}

    private configureReloadEvents() {
        const reloadFunction = async (file: TAbstractFile) => {
			if (file.path.endsWith('.csv')) {
				await this.reload();
                this.plugin.refreshAPIs();
			}
		}
		this.plugin.registerEvent(this.plugin.app.vault.on('create', reloadFunction));
		this.plugin.registerEvent(this.plugin.app.vault.on('delete', reloadFunction));
		this.plugin.registerEvent(this.plugin.app.vault.on('modify', reloadFunction));
		this.plugin.registerEvent(this.plugin.app.vault.on('rename', reloadFunction));
    }

    private configureCodeBlockProcessor() {
        this.plugin.registerMarkdownCodeBlockProcessor("wb-csv", (source, el, _) => {
            // Source should be the file name + extension
            source = source.trim();
            console.log("Generating CSV table for " + source + ".");
            const csvRows = this.csvFileCache.get(source);
            if (csvRows === undefined) {
                console.error("Cache did not contain this source.");
                console.error("CSV table not rendered");
                return;
            }

            const table = el.createEl("table");
            const header = table.createEl("thead");
            const headerRow = header.createEl("tr");
            const headerCSVRow = csvRows[0] as any;
            for (let j = 0; j < headerCSVRow.length; j++) {
                headerRow.createEl("th", { text: headerCSVRow[j] });
            }


            const body = table.createEl("tbody");
            for (let i = 1; i < csvRows.length; i++) {
                const cols = csvRows[i] as any;
                const row = body.createEl("tr");

                for (let j = 0; j < cols.length; j++) {
                row.createEl("td", { text: cols[j] });
                }
            }
        });
    }
}