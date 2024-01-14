import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

export class CSVManager {
    csvFileCache: Map<string, string[][]>;
    plugin: WorldBuildingPlugin;

    constructor(plugin: WorldBuildingPlugin) {
        this.csvFileCache = new Map<string, string[][]>();
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

    public parseCSVString(content: string): string[][] {
        const parsed = parse(content);
        const converted = this.parseTo2DStringArray(parsed);
        return converted;
    }

    public stringifyCSVArray(content: string[][]): string {
        const stringified = stringify(content);
        return stringified;
    }

    public async readFile(path: string, fileName: string, extension: string): Promise<string[][] | undefined> {
        if (extension === 'csv') {
            const content = await this.plugin.adapter.read(path + '/' + fileName + '.' + extension);
            const parsed = parse(content);
            const converted = this.parseTo2DStringArray(parsed);
            return converted;
        }
        else {
            console.error("Invalid file extension.");
            return undefined;
        }
    }

    public async writeFile<Content>(path: string, fileName:string, extension: string, content: Content) {
        if (extension === 'csv') {
            if (content instanceof Array) {
                const stringified = stringify(content, {header: true});
                await this.plugin.adapter.write(path + '/' + fileName + '.' + extension, stringified);
            }
            else {
                console.error("Invalid content type.");
            }
        }
        else {
            console.error("Invalid file extension.");
        }
    }

    public getCSVData(fileName: string): string[][] | undefined {
        const data = this.csvFileCache.get(fileName);
        if (data === undefined) {
            console.error("Cache did not contain this file.");
            return undefined;
        }
        return data;
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
            const converted = this.parseTo2DStringArray(parsed);
            this.csvFileCache.set(file_name, converted);
            loadedFiles = loadedFiles + 1;
        }

        console.info('Found and cached ' + loadedFiles + ' CSV files.');
	}

    private parseTo2DStringArray(parseResult: unknown[][]) {
        const result: string[][] = [];
        for (let i = 0; i < parseResult.length; i++) {
            const row = parseResult[i];
            const rowArray: string[] = [];
            for (let j = 0; j < row.length; j++) {
                rowArray.push(row[j] as string);
            }
            result.push(rowArray);
        }
        return result;
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
            const headerCSVRow = csvRows[0];
            for (let j = 0; j < headerCSVRow.length; j++) {
                headerRow.createEl("th", { text: headerCSVRow[j] });
            }


            const body = table.createEl("tbody");
            for (let i = 1; i < csvRows.length; i++) {
                const cols = csvRows[i];
                const row = body.createEl("tr");

                for (let j = 0; j < cols.length; j++) {
                row.createEl("td", { text: cols[j] });
                }
            }
        });
    }
}