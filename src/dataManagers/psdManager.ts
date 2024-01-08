import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import Psd, { Layer } from "@webtoon/psd";
import { stringify } from "yaml";

class CountryData {
    name: string;
    pixelCount: number;
}

class PoliticalData {
    countryData: CountryData[];
}

class MapData {
    height: number;
    width: number;
    politicalData: PoliticalData;
}

export class PSDManager {
    fileCache: Map<string, TAbstractFile>;
    psdFileCache: Map<string, Psd>;
    mapDataCache: Map<string, MapData>;
    plugin: WorldBuildingPlugin;

    constructor(plugin: WorldBuildingPlugin) {
        this.fileCache = new Map<string, TAbstractFile>();
        this.psdFileCache = new Map<string, Psd>();
        this.mapDataCache = new Map<string, MapData>();
        this.plugin = plugin;
    }

    public async load() {
        await this.reloadAndCachePSDFiles();
        await this.gatherAndWriteStatistics();
        this.configureReloadEvents();
    }

    public async reload() {
        await this.reloadAndCachePSDFiles();
        await this.gatherAndWriteStatistics();
    }

    public async unload() {
        this.invalidateCache();
    }

    private invalidateCache() {
        this.psdFileCache.clear();
        this.mapDataCache.clear();
        this.fileCache.clear();
    }

    public getPSDData(fileName: string): Psd | undefined {
        const data = this.psdFileCache.get(fileName);
        if (data === undefined) {
            console.error("Cache did not contain this file.");
            return undefined;
        }
        return data;
    }

    private async reloadAndCachePSDFiles() {
        this.invalidateCache();
        console.log("Loading all PSD files in vault.");
        const allFiles = this.plugin.app.vault.getAllLoadedFiles();
        let loadedFiles = 0;
        for (const file of allFiles) {
            if (file.name.endsWith('.psd')) {
                const binaryFile = await this.plugin.adapter.readBinary(file.path);
                const psdFile: Psd = Psd.parse(binaryFile);
                this.psdFileCache.set(file.name, psdFile);
                this.fileCache.set(file.name, file);
                loadedFiles = loadedFiles + 1;
            }
            else {
                continue;
            }
        }

        console.info('Found and cached ' + loadedFiles + ' PSD files.');
	}

    public async gatherAndWriteStatistics() {
        for (const [fileName, psdFile] of this.psdFileCache) {
            for (const node of psdFile.children) {
                if (node.type === 'Group' &&
                    node.name === 'Political') {
                    const mapData: MapData = new MapData();
                    mapData.height = psdFile.height;
                    mapData.width = psdFile.width;
                    mapData.politicalData = new PoliticalData();
                    const pData = mapData.politicalData;
                    pData.countryData = [];
                    for (let politicalLayer of node.children) {
                        const countryData = new CountryData();
                        countryData.name = politicalLayer.name;
                        politicalLayer = politicalLayer as Layer;
                        const pixels = await politicalLayer.composite(false, false);
                        countryData.pixelCount = this.countPixels(pixels);
                        pData.countryData.push(countryData);
                    }
                    this.mapDataCache.set(fileName, mapData);
                }
            }
        }
        console.log('Found and cached ' + this.mapDataCache.size + ' maps with political data.');

        for (const [fileName, mapData] of this.mapDataCache) {
            const content = "---\n" + stringify(mapData) + "---\n";
            const path = this.fileCache.get(fileName)?.path.split('/').slice(0, -1).join('/');
            const cleanName = fileName.split('.').slice(0, -1).join('.');
            await this.plugin.adapter.write(path + '/' + cleanName + '.md', content);
        }
    }

    private countPixels(pixels: Uint8ClampedArray): number {
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i+3] !== 0) {
                count++;
            }
        }
        return count;
    }

    private configureReloadEvents() {
        const reloadFunction = async (file: TAbstractFile) => {
			if (file.path.endsWith('.psd')) {
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