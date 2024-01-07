import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import Psd, { Layer } from "@webtoon/psd";

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
    psdFileCache: Map<string, Psd>;
    mapDataCache: Map<string, MapData>;
    plugin: WorldBuildingPlugin;

    constructor(plugin: WorldBuildingPlugin) {
        this.psdFileCache = new Map<string, Psd>();
        this.mapDataCache = new Map<string, MapData>();
        this.plugin = plugin;
    }

    public async load() {
        console.log('Loading PSD Manager');
        await this.reloadAndCachePSDFiles();
        this.configureReloadEvents();
        await this.gatherAndWriteStatistics();
    }

    public async reload() {
        this.reloadAndCachePSDFiles();
    }

    public async unload() {
        this.invalidateCache();
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
        console.log(this.mapDataCache);
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

    private invalidateCache() {
        this.psdFileCache.clear();
    }

    //public getPSDData(fileName: string): Psd {
    //    const data = this.psdFileCache.get(fileName);
    //    if (data === undefined) {
    //        console.log("Cache did not contain this file.");
    //        return ;
    //    }
    //    return data;
    //}

    private async reloadAndCachePSDFiles() {
        this.invalidateCache();
        const allFiles = this.plugin.app.vault.getAllLoadedFiles();
        let loadedFiles = 0;
        for (const file of allFiles) {
            if (file.name.endsWith('.psd')) {
                const binaryFile = await this.plugin.adapter.readBinary(file.path);
                const psdFile: Psd = Psd.parse(binaryFile);
                console.log('Found PSD file: ' + file.name);
                console.log(psdFile);
                this.psdFileCache.set(file.name, psdFile);
                loadedFiles = loadedFiles + 1;
            } 
            else {
                continue; 
            }
        }

        console.info('Found and cached ' + loadedFiles + ' PSD files.');
	}

    private configureReloadEvents() {
        const reloadFunction = async (file: TAbstractFile) => {
			if (file.path.endsWith('.psd')) {
				await this.reloadAndCachePSDFiles();
                this.plugin.refreshAPIs();
				console.log('PSD Files reloaded.');
			}
		}
		this.plugin.registerEvent(this.plugin.app.vault.on('create', reloadFunction));
		this.plugin.registerEvent(this.plugin.app.vault.on('delete', reloadFunction));
		this.plugin.registerEvent(this.plugin.app.vault.on('modify', reloadFunction));
		this.plugin.registerEvent(this.plugin.app.vault.on('rename', reloadFunction));
    }
}