import { TAbstractFile, TFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import Psd from "@webtoon/psd";
import { Logger } from "src/util/Logger";
import { Result } from "src/errors/result";
import { BaseError } from "src/errors/baseError";
import { CSVUtils } from "src/util/csv";
import { CompositeLayer, PSDUtils } from "src/util/psd";

class CountryData {
  name: string;
  rawPixelCount: number;
  percentOfTotalMapArea: number;
  //The following will be populated if _MapConfig.csv exists in the same directory as the PSD file and has an entry for this country.
  unitArea: number;
}

class MapData {
  pixelHeight: number;
  pixelWidth: number;
  pixelTotal: number;

  countryData: CountryData[];

  // Config Based Data
  configData: {
    unitHeight: number;
    unitWidth: number;
    unit: string;
    unitHeightToPixelRatio: number;
    unitWidthToPixelRatio: number;
    unitAreaToPixelRatio: number;
  };
}

class MapConfig {
  mapName: string;
  unitHeight: number;
  unitWidth: number;
  unit: string;
  geometry: string;
}

class CacheEntry {
  file: TAbstractFile;
  psd: Psd;
  image: ImageBitmap | null;

  processedFile: TAbstractFile | null;
  processedData: MapData;
}

export class PSDManager {
  plugin: WorldBuildingPlugin;
  psdMap: Map<string, CacheEntry>;

  configFile: TAbstractFile | undefined;
  configData: MapConfig[] | undefined;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.psdMap = new Map<string, CacheEntry>();
    this.configFile = undefined;
    this.configData = undefined;
  }

  public async initialize() {
    await this.updateConfig();
    const allFiles = this.plugin.app.vault.getAllLoadedFiles();
    for (const file of allFiles) {
      if (this.isFileSupported(file)) {
        await this.createEntryFromFile(file);
      }
    }
  }

  public async updateConfig() {
    const configPath = this.plugin.settings.mapConfigPath;
    const configFile = this.plugin.app.vault.getAbstractFileByPath(configPath);
    if (configFile === null) {
      Logger.error(this, "Map Config file not found.");
      return;
    }
    this.configFile = configFile;
    const configData = await CSVUtils.readCSVByPath(configFile.path, this.plugin.app.vault, true);
    this.configData = [];
    for (const config of configData) {
      const mapConfig = new MapConfig();
      mapConfig.mapName = config[0];
      mapConfig.unitHeight = parseInt(config[1]);
      mapConfig.unitWidth = parseInt(config[2]);
      mapConfig.unit = config[3];
      mapConfig.geometry = config[4];
      this.configData.push(mapConfig);
    }
    // Update all the entries with the new config data.
    for (const [, entry] of this.psdMap) {
      this.updateEntryConfig(entry);
    }
  }

  public async registerEventCallbacks() {
    const creationEvent = async (file: TAbstractFile) => {
      // For new PSD files, create them.
      if (this.isFileSupported(file)) {
        await this.createEntryFromFile(file);
      }
      // If for some reason the config file path is being created, update the config data.
      if (file.path === this.plugin.settings.mapConfigPath) {
        await this.updateConfig();
      }
    };
    const deletionEvent = (file: TAbstractFile) => {
      if (this.psdMap.has(file.path)) {
        this.psdMap.delete(file.path);
      }
      // If for some reason the config file path is being deleted, clear the config data.
      if (file.path === this.plugin.settings.mapConfigPath) {
        this.configFile = undefined;
        this.configData = undefined;
      }
    };
    const renameEvent = async (file: TAbstractFile, oldPath: string) => {
      if (this.psdMap.has(oldPath)) {
        const entry = this.psdMap.get(oldPath) as CacheEntry;
        this.psdMap.delete(oldPath);
        this.psdMap.set(file.path, entry);
      }
      // If we are renaming the config file to something else, clear the config data.
      if (oldPath === this.plugin.settings.mapConfigPath) {
        this.configFile = undefined;
        this.configData = undefined;
      }
      // Else if we are renaming something to the config file, update the config data.
      if (file.path === this.plugin.settings.mapConfigPath) {
        await this.updateConfig();
      }
    };
    const modifyEvent = async (file: TAbstractFile) => {
      if (this.psdMap.has(file.path)) {
        const entry = this.psdMap.get(file.path) as CacheEntry;
        const newBinaryContent = await this.plugin.app.vault.readBinary(file as TFile);
        entry.psd = Psd.parse(newBinaryContent);
        await this.processEntry(entry, false);
      }
      if (this.plugin.settings.mapConfigPath === file.path) {
        await this.updateConfig();
      }
    };

    this.plugin.registerEvent(this.plugin.app.vault.on("create", creationEvent));
    this.plugin.registerEvent(this.plugin.app.vault.on("delete", deletionEvent));
    this.plugin.registerEvent(this.plugin.app.vault.on("rename", renameEvent));
    this.plugin.registerEvent(this.plugin.app.vault.on("modify", modifyEvent));
  }

  public findCountryData(country: string): Result<CountryData> {
    for (const [, entry] of this.psdMap) {
      for (const countryData of entry.processedData.countryData) {
        if (countryData.name === country) {
          return { success: true, result: countryData };
        }
      }
    }

    return { success: false, error: new BaseError("Country not found.") };
  }

  public getImage(fullPath: string) {
    const entry = this.psdMap.get(fullPath);
    if (entry === undefined) {
      return null;
    }
    return entry.image;
  }

  public async reprocessAllMaps() {
    Logger.debug(this, "Reprocessing found PSD files.");
    for (const [, entry] of this.psdMap) {
      await this.processEntry(entry, true);
    }
  }

  private async createEntryFromFile(file: TAbstractFile) {
    const cacheEntry = new CacheEntry();
    cacheEntry.file = file;

    const binaryContent = await this.plugin.app.vault.readBinary(file as TFile);
    cacheEntry.psd = Psd.parse(binaryContent);

    cacheEntry.processedFile = this.plugin.app.vault.getAbstractFileByPath(file.path.replace(".psd", ".md"));
    await this.processEntry(cacheEntry, this.plugin.settings.processMapsOnLoad);

    this.psdMap.set(file.path, cacheEntry);
  }

  private updateEntryConfig(entry: CacheEntry) {
    if (this.configData === undefined) {
      return;
    }

    const configData = this.configData.find((config) => config.mapName === entry.file.name);
    if (configData === undefined) {
      return;
    }
    entry.processedData.configData = {
      unitHeight: configData.unitHeight,
      unitWidth: configData.unitWidth,
      unit: configData.unit,
      unitHeightToPixelRatio: configData.unitHeight / entry.processedData.pixelHeight,
      unitWidthToPixelRatio: configData.unitWidth / entry.processedData.pixelWidth,
      unitAreaToPixelRatio: (configData.unitHeight * configData.unitWidth) / entry.processedData.pixelTotal,
    };
    for (const country of entry.processedData.countryData) {
      country.unitArea = country.rawPixelCount * entry.processedData.configData.unitAreaToPixelRatio;
    }
  }

  private async processEntry(entry: CacheEntry, force: boolean = false): Promise<void> {
    // Setup our data structure in case we need to return early.
    const mapData: MapData = new MapData();
    mapData.pixelHeight = entry.psd.height;
    mapData.pixelWidth = entry.psd.width;
    mapData.pixelTotal = entry.psd.height * entry.psd.width;
    mapData.countryData = [];

    entry.processedData = mapData;

    // If we have a processed map file thats newer than the map file, use it.
    let needsRecalculation = false;
    if (entry.processedFile !== null) {
      const mF = entry.file as TFile;
      const pMF = entry.processedFile as TFile;
      if (mF.stat.mtime < pMF.stat.mtime) {
        // Map is older than the processed map, use the processed map data.
        const mapData = await this.plugin.frontMatterManager.getFrontMatter(entry.processedFile.path);
        entry.processedData = mapData;
      } else {
        // Need to recalculate the map data, as it is newer than the processed map.
        needsRecalculation = true;
      }
    } else {
      needsRecalculation = true;
    }

    if (force || needsRecalculation) {
      await this.processLayerData(entry);
    }

    const compositeBuffer = await entry.psd.composite();
    const imageData = new ImageData(compositeBuffer, entry.psd.width, entry.psd.height);
    entry.image = await createImageBitmap(imageData);

    this.updateEntryConfig(entry);

    await this.writeProcessedMapData(entry);
  }

  private async processLayerData(entry: CacheEntry) {
    const groupedLayers = await PSDUtils.getGroupedLayers(entry.psd);

    entry.processedData.countryData = [];
    for (const politicalLayer of groupedLayers.politicalLayers) {
      const countryData = new CountryData();
      countryData.name = politicalLayer.layer.name;
      countryData.rawPixelCount = await PSDUtils.findLayerIntersection(
        groupedLayers.baseLayer,
        politicalLayer,
        entry.psd.width,
        entry.psd.height
      );
      countryData.percentOfTotalMapArea = countryData.rawPixelCount / entry.processedData.pixelTotal;
      entry.processedData.countryData.push(countryData);
    }
    const sortBySize = (a: CountryData, b: CountryData) => {
      return b.rawPixelCount - a.rawPixelCount;
    };
    entry.processedData.countryData.sort(sortBySize);
  }

  private async writeProcessedMapData(entry: CacheEntry) {
    Logger.debug(this, "Writing processed map data for " + entry.file.path + ".");
    const newFilePath = entry.file.path.replace(".psd", ".md");
    const file = this.plugin.app.vault.getAbstractFileByPath(newFilePath);
    if (file === null) {
      await this.plugin.app.vault.create(newFilePath, "---\n---\n");
    }
    await this.plugin.frontMatterManager.replaceFrontMatter(newFilePath, entry.processedData);
  }

  private isFileSupported(file: TAbstractFile): boolean {
    if (file.path.endsWith(".psd")) {
      return true;
    }
    return false;
  }
}
