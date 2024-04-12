import { TAbstractFile, TFile } from "obsidian";
import WorldBuildingPlugin from "../../main";
import Psd from "@webtoon/psd";
import { Logger } from "src/util/Logger";
import { Result } from "src/errors/result";
import { BaseError } from "src/errors/baseError";
import { PSDUtils } from "src/util/psd";
import { PointOfInterest } from "../dataTypes";

export class PoliticalLayerData {
  name: string;
  percentOfTotalMapArea: number;
}

class MapData {
  politicalLayerData: PoliticalLayerData[];
  pointsOfInterest: PointOfInterest[];
}

class CacheEntry {
  file: TAbstractFile;
  psd: Psd;
  image: ImageBitmap | null;

  processedFilePath: string;
  processedData: MapData;
}

export class PSDManager {
  plugin: WorldBuildingPlugin;
  psdMap: Map<string, CacheEntry>;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.psdMap = new Map<string, CacheEntry>();
  }

  public async initialize() {
    const allFiles = this.plugin.app.vault.getAllLoadedFiles();
    for (const file of allFiles) {
      if (this.isFileSupported(file)) {
        await this.createEntryFromFile(file);
      }
    }
  }

  public async registerEventCallbacks() {
    const creationEvent = async (file: TAbstractFile) => {
      if (this.isFileSupported(file)) {
        await this.createEntryFromFile(file);
      }
    };
    const deletionEvent = (file: TAbstractFile) => {
      if (this.psdMap.has(file.path)) {
        this.psdMap.delete(file.path);
      }
    };
    const renameEvent = async (file: TAbstractFile, oldPath: string) => {
      if (this.psdMap.has(oldPath)) {
        const entry = this.psdMap.get(oldPath) as CacheEntry;
        this.psdMap.delete(oldPath);
        this.psdMap.set(file.path, entry);
      }
    };
    const modifyEvent = async (file: TAbstractFile) => {
      if (this.psdMap.has(file.path)) {
        const entry = this.psdMap.get(file.path) as CacheEntry;
        const newBinaryContent = await this.plugin.app.vault.readBinary(file as TFile);
        entry.psd = Psd.parse(newBinaryContent);
        await this.processEntry(entry, false);
      }
    };

    this.plugin.registerEvent(this.plugin.app.vault.on("create", creationEvent));
    this.plugin.registerEvent(this.plugin.app.vault.on("delete", deletionEvent));
    this.plugin.registerEvent(this.plugin.app.vault.on("rename", renameEvent));
    this.plugin.registerEvent(this.plugin.app.vault.on("modify", modifyEvent));
  }

  public findMapFileByCountry(country: string): Result<TAbstractFile> {
    for (const [, entry] of this.psdMap) {
      for (const countryData of entry.processedData.politicalLayerData) {
        if (countryData.name === country) {
          return { success: true, result: entry.file };
        }
      }
    }
    return { success: false, error: new BaseError("Country not found.") };
  }

  public findCountryData(country: string): Result<PoliticalLayerData> {
    for (const [, entry] of this.psdMap) {
      for (const countryData of entry.processedData.politicalLayerData) {
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

  public getPointsOfInterest(fullPath: string) {
    const entry = this.psdMap.get(fullPath);
    if (entry === undefined) {
      return undefined;
    }
    return entry.processedData.pointsOfInterest;
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

    cacheEntry.processedFilePath = file.path.replace(".psd", ".md");
    await this.processEntry(cacheEntry, this.plugin.settings.processMapsOnLoad);

    this.psdMap.set(file.path, cacheEntry);
  }

  private async processEntry(entry: CacheEntry, force: boolean = false): Promise<void> {
    await this.loadProcessedMapData(entry);
    const needsRecalculation = entry.processedData === null;

    if (force || needsRecalculation) {
      const mapData: MapData = new MapData();
      mapData.politicalLayerData = [];
      entry.processedData = mapData;
      await this.processLayerData(entry);
    }

    const compositeBuffer = await entry.psd.composite();
    const imageData = new ImageData(compositeBuffer, entry.psd.width, entry.psd.height);
    entry.image = await createImageBitmap(imageData);

    await this.writeProcessedMapData(entry);
  }

  private async loadProcessedMapData(entry: CacheEntry) {
    const processedFile = this.plugin.app.vault.getAbstractFileByPath(entry.processedFilePath);
    if (processedFile !== null && processedFile instanceof TFile && entry.file instanceof TFile) {
      if (entry.file.stat.mtime < processedFile.stat.mtime) {
        // Map is older than the processed map, use the processed map data.
        const mapData = await this.plugin.frontMatterManager.getFrontMatter(entry.processedFilePath);
        entry.processedData = mapData;
      }
    }
  }

  private async processLayerData(entry: CacheEntry) {
    const groupedLayers = await PSDUtils.getGroupedLayers(entry.psd);
    entry.processedData.pointsOfInterest = groupedLayers.pointsOfInterest;

    entry.processedData.politicalLayerData = [];
    for (const politicalLayer of groupedLayers.politicalLayers) {
      const countryData = new PoliticalLayerData();
      countryData.name = politicalLayer.layer.name;
      const rawPixelCount = await PSDUtils.findLayerIntersection(
        groupedLayers.baseLayer,
        politicalLayer,
        entry.psd.width,
        entry.psd.height
      );
      countryData.percentOfTotalMapArea = rawPixelCount / (entry.psd.width * entry.psd.height);
      entry.processedData.politicalLayerData.push(countryData);
    }
    const sortBySize = (a: PoliticalLayerData, b: PoliticalLayerData) => {
      return b.percentOfTotalMapArea - a.percentOfTotalMapArea;
    };
    entry.processedData.politicalLayerData.sort(sortBySize);
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
