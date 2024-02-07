import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import Psd, { Layer, NodeChild } from "@webtoon/psd";
import { CacheManager } from "./cacheManager";
import { LogLevel, logger } from "src/util";
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

export class PSDManager extends CacheManager<PsdData> {
  constructor(plugin: WorldBuildingPlugin) {
    super(plugin);
  }

  override async readFile(fullPath: string): Promise<PsdData | undefined> {
    if (fullPath.endsWith(".psd")) {
      const binaryFile = await this.plugin.adapter.readBinary(fullPath);
      const psd: Psd = Psd.parse(binaryFile);
      const psdData: PsdData = await this.parsePsd(fullPath, psd);
      return psdData;
    }
    return undefined;
  }

  override async writeFile<Content>(fullPath: string, content: Content, options: any = null) {
    // No-op for now.
  }

  override isFileManageable(file: TAbstractFile): boolean {
    if (file.name.endsWith(".psd")) {
      return true;
    }
    return false;
  }

  public findCountryData(country: string): Result<CountryData> {
    for (const [key, value] of this.fileCache) {
      if (value.data) {
        if (value.data.mapData.countryData !== undefined) {
          for (const countryData of value.data.mapData.countryData) {
            if (countryData.name === country) {
              this.populateConfigData(value.data.mapData, key, value.data.file);
              return { success: true, result: countryData };
            }
          }
        }
      }
    }
    return { success: false, error: new BaseError("Country not found.") };
  }

  public writeMapConfigData(fullPath: string = "") {
    // If no path is passed in, write all the files.
    if (fullPath === "") {
      for (const [key, value] of this.fileCache) {
        const newFilePath = key.replace(".psd", ".md");
        this.plugin.yamlManager.writeFile(newFilePath, value.data?.mapData);
      }
    } else {
      const psdData = this.fileCache.get(fullPath);
      if (psdData === undefined) {
        logger(this, LogLevel.Error, "Could not find psd data.");
        return;
      }
      const newFilePath = fullPath.replace(".psd", ".md");
      this.plugin.yamlManager.writeFile(newFilePath, psdData.data?.mapData);
    }
  }

  private async parsePsd(fullPath: string, psd: Psd): Promise<PsdData> {
    const psdData = new PsdData();
    psdData.file = psd;

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
      logger(this, LogLevel.Warning, "No base layer found.");
      return psdData;
    }
    if (politicalLayers.length === 0) {
      logger(this, LogLevel.Warning, "No political layers found.");
      return psdData;
    }

    const mapData: MapData = new MapData();
    mapData.pixelHeight = psdData.file.height;
    mapData.pixelWidth = psdData.file.width;
    mapData.countryData = [];

    for (const politicalLayer of politicalLayers) {
      const countryData = new CountryData();
      countryData.name = politicalLayer.name;
      countryData.rawPixelCount = await this.findLayerIntersection(baseLayer, politicalLayer, psd.width, psd.height);
      countryData.percentOfTotalMapArea = countryData.rawPixelCount / (psd.width * psd.height);
      mapData.countryData.push(countryData);
    }

    this.populateConfigData(mapData, fullPath, psd);

    psdData.mapData = mapData;

    if (this.plugin.settings.writeMapStatisticsOnLoad) {
      this.writeMapConfigData(fullPath);
    }

    return psdData;
  }

  // Pass in the topography group then get the base layer.
  private getBaseLayer(topographyGroupNode: NodeChild): Layer | undefined {
    if (topographyGroupNode.children === undefined) {
      logger(this, LogLevel.Warning, "Topography group node has no children.");
      return undefined;
    }

    for (const node of topographyGroupNode.children) {
      if (node.type === "Layer" && node.name === "Base") {
        return node as Layer;
      }
    }

    logger(this, LogLevel.Warning, "Topography group node has no base layer.");
    return undefined;
  }

  private populateConfigData(mapData: MapData, fullPath: string, psd: Psd) {
    // Read in _MapConfig.csv if it exists
    const fileName = fullPath.split("/").pop();
    if (fileName !== undefined) {
      const mapConfig = this.plugin.csvManager.getDataByFile(fullPath.replace(fileName, "_MapConfig.csv"));
      if (mapConfig !== undefined) {
        mapConfig.shift();
        for (const mapConfigRow of mapConfig) {
          if (fullPath.includes(mapConfigRow[0])) {
            mapData.unitHeight = parseInt(mapConfigRow[1]);
            mapData.unitWidth = parseInt(mapConfigRow[2]);
            mapData.unit = mapConfigRow[3];
            mapData.unitArea = mapData.unitHeight * mapData.unitWidth;
            mapData.unitHeightToPixelRatio = mapData.unitHeight / psd.height;
            mapData.unitWidthToPixelRatio = mapData.unitWidth / psd.width;
            mapData.unitAreaToPixelRatio = mapData.unitArea / (psd.width * psd.height);

            for (const countryData of mapData.countryData) {
              countryData.unitArea = countryData.rawPixelCount * mapData.unitAreaToPixelRatio;
            }
          }
        }
      }
    }
  }

  // Pass in the political group then get the political layers.
  private getPoliticalLayers(politicalGroupNode: NodeChild): Layer[] {
    if (politicalGroupNode.children === undefined) {
      logger(this, LogLevel.Warning, "Political group node has no children.");
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
          logger(this, LogLevel.Error, "Index 1 out of bounds.");
        }
        if (index2 < 0 || index2 >= layer2Pixels.length) {
          logger(this, LogLevel.Error, "Index 2 out of bounds.");
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
