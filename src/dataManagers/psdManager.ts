import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import Psd, { Layer, NodeChild } from "@webtoon/psd";
import { CacheManager } from "./cacheManager";
import { Logger } from "src/util";
import { Result } from "src/errors/result";
import { BaseError } from "src/errors/baseError";

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
  unitHeight: number;
  unitWidth: number;
  unitArea: number;
  unit: string;
  unitHeightToPixelRatio: number;
  unitWidthToPixelRatio: number;
  unitAreaToPixelRatio: number;
  countryData: CountryData[];
}

class PsdData {
  file: Psd;
  mapData: MapData;
}

type CacheType = PsdData;
export class PSDManager extends CacheManager<CacheType> {
  constructor(plugin: WorldBuildingPlugin) {
    super(plugin);
  }

  override async readFile(fullPath: string): Promise<Result<CacheType>> {
    if (fullPath.endsWith(".psd")) {
      const binaryFile = await this.plugin.adapter.readBinary(fullPath);
      const psd: Psd = Psd.parse(binaryFile);
      const psdData = new PsdData();
      psdData.file = psd;
      psdData.mapData = new MapData();
      return { success: true, result: psdData };
    }
    return { success: false, error: new BaseError("Invalid file extension.") };
  }

  override async writeFile(fullPath: string, content: PsdData, options: any = null): Promise<Result<void>> {
    return { success: false, error: new BaseError("Not implemented.") };
  }

  override isFileManageable(file: TAbstractFile): boolean {
    if (file.name.endsWith(".psd")) {
      return true;
    }
    return false;
  }

  public async processPSDs() {
    Logger.debug(this, "Processing found PSD files.");
    const keys: string[] = [];
    const promises = [];
    for (const [key, value] of this.fileCache) {
      if (value.data) {
        keys.push(key);
        promises.push(this.parsePsd(value.file.path, value.data.file));
      }
    }
    return Promise.allSettled(promises).then((results) => {
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === "fulfilled") {
          const result = results[i] as PromiseFulfilledResult<PsdData>;
          const cacheEntry = this.fileCache.get(keys[i]);
          if (cacheEntry === undefined) {
            Logger.error(this, "Could not find cache entry.");
            return;
          }
          cacheEntry.data = result.value;
        }
      }
    });
  }

  public findCountryData(country: string): Result<CountryData> {
    for (const [key, value] of this.fileCache) {
      if (value.data) {
        if (value.data.mapData.countryData !== undefined) {
          for (const countryData of value.data.mapData.countryData) {
            if (countryData.name === country) {
              this.updateCountriesUsingConfigData(value.data.mapData, key, value.data.file);
              return { success: true, result: countryData };
            }
          }
        }
      }
    }
    return { success: false, error: new BaseError("Country not found.") };
  }

  public writeMapConfigData(fullPath: string = "") {
    Logger.debug(this, "Writing processed map data.");
    // If no path is passed in, write all the files.
    if (fullPath === "") {
      for (const [key, value] of this.fileCache) {
        const newFilePath = key.replace(".psd", ".md");
        this.plugin.yamlManager.writeFile(newFilePath, value.data?.mapData);
      }
    } else {
      const psdData = this.fileCache.get(fullPath);
      if (psdData === undefined) {
        Logger.error(this, "Could not find psd data.");
        return;
      }
      const newFilePath = fullPath.replace(".psd", ".md");
      this.plugin.yamlManager.writeFile(newFilePath, psdData.data?.mapData);
    }
  }

  private async parsePsd(fullPath: string, psd: Psd): Promise<PsdData> {
    // Setup our data structure in case we need to return early.
    const psdData = new PsdData();
    psdData.file = psd;
    const mapData: MapData = new MapData();
    mapData.pixelHeight = psdData.file.height;
    mapData.pixelWidth = psdData.file.width;
    mapData.countryData = [];

    psdData.mapData = mapData;

    let baseLayer: Layer | undefined = undefined;
    let politicalLayers: Layer[] = [];

    // Get Layer Groups
    for (const node of psd.children) {
      if (node.type === "Group") {
        switch (node.name) {
          case "Topography":
            baseLayer = this.getBaseLayer(node);
            break;
          case "Political":
            politicalLayers = this.getPoliticalLayers(node);
            break;
        }
      }
    }

    if (baseLayer === undefined) {
      Logger.warn(this, "No base layer found.");
      return psdData;
    }
    if (politicalLayers.length === 0) {
      Logger.warn(this, "No political layers found.");
      return psdData;
    }

    const promises = [];
    for (const politicalLayer of politicalLayers) {
      const countryData = new CountryData();
      countryData.name = politicalLayer.name;
      promises.push(this.findLayerIntersection(baseLayer, politicalLayer, psd.width, psd.height));
      mapData.countryData.push(countryData);
    }

    const results = await Promise.allSettled(promises);
    // Fill in the country data with the results.
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === "fulfilled") {
        const result = results[i] as PromiseFulfilledResult<number>;
        const countryData = mapData.countryData[i];
        countryData.rawPixelCount = result.value;
        countryData.percentOfTotalMapArea = countryData.rawPixelCount / (psd.width * psd.height);
      }
    }

    this.updateCountriesUsingConfigData(mapData, fullPath, psd);

    if (this.plugin.settings.writeMapStatisticsOnLoad) {
      this.writeMapConfigData(fullPath);
    }

    return psdData;
  }

  // Pass in the topography group then get the base layer.
  private getBaseLayer(topographyGroupNode: NodeChild): Layer | undefined {
    if (topographyGroupNode.children === undefined) {
      Logger.warn(this, "Topography group node has no children.");
      return undefined;
    }

    for (const node of topographyGroupNode.children) {
      if (node.type === "Layer" && node.name === "Base") {
        return node as Layer;
      }
    }

    Logger.warn(this, "Topography group node has no base layer.");
    return undefined;
  }

  private updateCountriesUsingConfigData(mapData: MapData, fullPath: string, psd: Psd) {
    // Read in _MapConfig.csv if it exists
    const fileName = fullPath.split("/").pop();
    if (fileName === undefined) {
      return;
    }

    const result = this.plugin.csvManager.getDataByFile(fullPath.replace(fileName, "_MapConfig.csv"));
    if (result.success === false) {
      return;
    }

    const mapConfig = result.result;
    mapConfig.shift();
    for (const mapConfigRow of mapConfig) {
      if (fullPath.includes(mapConfigRow[0])) {
        mapData.unitHeight = parseInt(mapConfigRow[1]);
        mapData.unitWidth = parseInt(mapConfigRow[2]);
        mapData.unit = mapConfigRow[3];
        mapData.unitArea = mapData.unitHeight * mapData.unitWidth;
        mapData.unitHeightToPixelRatio = mapData.unitHeight / psd.height;
        mapData.unitWidthToPixelRatio = mapData.unitWidth / psd.width;
        mapData.unitAreaToPixelRatio = mapData.unitHeightToPixelRatio * mapData.unitWidthToPixelRatio;

        for (const countryData of mapData.countryData) {
          countryData.unitArea = countryData.rawPixelCount * mapData.unitAreaToPixelRatio;
        }
      }
    }
  }

  // Pass in the political group then get the political layers.
  private getPoliticalLayers(politicalGroupNode: NodeChild): Layer[] {
    if (politicalGroupNode.children === undefined) {
      Logger.warn(this, "Political group node has no children.");
      return [];
    }

    const politicalLayers: Layer[] = [];
    for (const node of politicalGroupNode.children) {
      if (node.type === "Layer") {
        politicalLayers.push(node as Layer);
      }
    }
    return politicalLayers;
  }

  // Not quite perfect. But good enough for now.
  private async findLayerIntersection(
    layer1: Layer,
    layer2: Layer,
    fileWidth: number,
    fileHeight: number
  ): Promise<number> {
    // Find the intersection of the two layers.
    // The intersection is the pixels that are not transparent in both layers.
    const layer1Pixels = await layer1.composite(false, false);
    const layer2Pixels = await layer2.composite(false, false);

    const selection1Up = layer1.top;
    const selection1Left = layer1.left;
    const selection1Right = layer1.width + selection1Left - 1;
    const selection1Bottom = layer1.height + selection1Up - 1;

    const selection2Up = layer2.top;
    const selection2Left = layer2.left;
    const selection2Right = layer2.width + selection2Left - 1;
    const selection2Bottom = layer2.height + selection2Up - 1;

    let intersectionPixelCount = 0;

    for (let column = 0; column < fileWidth; column++) {
      for (let row = 0; row < fileHeight; row++) {
        // Bounds checking Layer 1
        if (column < selection1Left || column >= selection1Right) {
          continue;
        }
        if (row < selection1Up || row >= selection1Bottom) {
          continue;
        }

        // Bounds checking Layer 2
        if (column < selection2Left || column >= selection2Right) {
          continue;
        }
        if (row < selection2Up || row >= selection2Bottom) {
          continue;
        }

        const index1 = (column - selection1Left) * 4 + (row - selection1Up) * layer1.width * 4;
        const index2 = (column - selection2Left) * 4 + (row - selection2Up) * layer2.width * 4;

        // Composite Space bounds checking
        if (index1 < 0 || index1 >= layer1Pixels.length) {
          Logger.error(this, "Index 1 out of bounds.");
        }
        if (index2 < 0 || index2 >= layer2Pixels.length) {
          Logger.error(this, "Index 2 out of bounds.");
        }

        // Is the pixel visible in both layers?
        // Check the alpha pixel and make sure it's not fully transparent.
        if (layer1Pixels[index1 + 3] !== 0 && layer2Pixels[index2 + 3] !== 0) {
          intersectionPixelCount++;
        }
      }
    }

    return intersectionPixelCount;
  }
}
