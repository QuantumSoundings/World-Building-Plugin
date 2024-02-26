import { TAbstractFile, TFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import Psd, { Layer, NodeChild } from "@webtoon/psd";
import { CacheManager } from "./cacheManager";
import { Logger } from "src/util";
import { Result } from "src/errors/result";
import { BaseError } from "src/errors/baseError";
import { CSVUtils } from "src/util/csv";

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

class CompositeLayer {
  layer: Layer;
  composite: Uint8ClampedArray;
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
      // Processing this maps is a different operation from loading them.
      const psdData = new PsdData();
      psdData.file = psd;
      psdData.mapData = new MapData();
      return { success: true, result: psdData };
    }
    return { success: false, error: new BaseError("Invalid file extension.") };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async writeFile(fullPath: string, content: PsdData, options: any = null): Promise<Result<void>> {
    return { success: false, error: new BaseError("Not implemented.") };
  }

  override isFileManageable(file: TAbstractFile): boolean {
    if (file.path.endsWith(".psd")) {
      return true;
    }
    return false;
  }

  public async processPSDs(forceRecalculate: boolean) {
    Logger.debug(this, "Processing found PSD files.");
    for (const [, value] of this.fileCache) {
      if (value.data) {
        const psd = await this.processPsd(value.file.path, value.data.file, forceRecalculate);
        value.data = psd;
      }
    }
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

  public writeAllProcessedMapData() {
    for (const [, value] of this.fileCache) {
      if (value.data !== undefined) {
        if (value.data.mapData !== undefined) {
          this.writeProcessedMapData(value.file.path, value.data.mapData);
        }
      }
    }
  }

  private async writeProcessedMapData(fullPath: string, mapData: MapData) {
    Logger.debug(this, "Writing processed map data for " + fullPath + ".");
    const newFilePath = fullPath.replace(".psd", ".md");
    const file = this.plugin.app.vault.getAbstractFileByPath(newFilePath);
    if (file === null) {
      await this.plugin.app.vault.create(newFilePath, "---\n---\n");
    }
    await this.plugin.frontMatterManager.replaceFrontMatter(newFilePath, mapData);
  }

  private async processPsd(fullPath: string, psd: Psd, force: boolean = false): Promise<PsdData> {
    // Setup our data structure in case we need to return early.
    const psdData = new PsdData();
    psdData.file = psd;
    const mapData: MapData = new MapData();
    mapData.pixelHeight = psdData.file.height;
    mapData.pixelWidth = psdData.file.width;
    mapData.countryData = [];
    psdData.mapData = mapData;

    // If we have a processed map file thats newer than the map file, use it.
    if (force === false) {
      const mapFile = this.plugin.app.vault.getAbstractFileByPath(fullPath);
      const processedMapFile = this.plugin.app.vault.getAbstractFileByPath(fullPath.replace(".psd", ".md"));
      if (mapFile !== null && processedMapFile !== null) {
        const mF = mapFile as TFile;
        const pMF = processedMapFile as TFile;
        // Map is older than the processed map.
        if (mF.stat.mtime < pMF.stat.mtime) {
          const mapData = (await this.plugin.frontMatterManager.getFrontMatter(pMF.path)) as MapData;
          psdData.mapData = mapData;
          return psdData;
        }
      }
    }

    let baseCompositeLayer: CompositeLayer = new CompositeLayer();
    const politicalCompositeLayers: CompositeLayer[] = [];

    // Get the needed composite layers from the PSD.
    for (const node of psd.children) {
      if (node.type === "Group") {
        switch (node.name) {
          case "Topography": {
            const baseLayer = this.getBaseLayer(node);
            if (baseLayer !== undefined) {
              baseCompositeLayer = await this.layerToComposite(baseLayer);
            } else {
              Logger.warn(this, "No base layer found.");
              return psdData;
            }
            break;
          }
          case "Political": {
            const politicalLayers = this.getPoliticalLayers(node);
            if (politicalLayers.length === 0) {
              Logger.warn(this, "No political layers found.");
              return psdData;
            }
            for (const politicalLayer of politicalLayers) {
              const compositeLayer = await this.layerToComposite(politicalLayer);
              politicalCompositeLayers.push(compositeLayer);
            }
            break;
          }
        }
      }
    }

    for (const politicalLayer of politicalCompositeLayers) {
      const countryData = new CountryData();
      countryData.name = politicalLayer.layer.name;
      countryData.rawPixelCount = await this.findLayerIntersection(
        baseCompositeLayer,
        politicalLayer,
        psd.width,
        psd.height
      );
      countryData.percentOfTotalMapArea = countryData.rawPixelCount / (psd.width * psd.height);
      mapData.countryData.push(countryData);
    }

    this.updateCountriesUsingConfigData(mapData, fullPath, psd);

    await this.writeProcessedMapData(fullPath, mapData);

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

  private async updateCountriesUsingConfigData(mapData: MapData, fullPath: string, psd: Psd) {
    // Read in _MapConfig.csv if it exists
    const fileName = fullPath.split("/").pop();
    if (fileName === undefined) {
      return;
    }

    const data = await CSVUtils.getCSVByPath(fullPath.replace(fileName, "_MapConfig.csv"), this.plugin.app.vault); // this.plugin.csvManager.getDataByFile(fullPath.replace(fileName, "_MapConfig.csv"));

    const mapConfig = CSVUtils.csvArrayToStringArray(data);
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

  private async layerToComposite(layer: Layer): Promise<CompositeLayer> {
    const composite = await layer.composite(false, false);
    const compositeLayer = new CompositeLayer();
    compositeLayer.layer = layer;
    compositeLayer.composite = composite;
    return compositeLayer;
  }

  // Not quite perfect. But good enough for now.
  private async findLayerIntersection(
    layer1: CompositeLayer,
    layer2: CompositeLayer,
    fileWidth: number,
    fileHeight: number
  ): Promise<number> {
    // Find the intersection of the two layers.
    // The intersection is the pixels that are not transparent in both layers.
    const layer1Pixels = layer1.composite;
    const layer2Pixels = layer1.composite;

    const selection1Up = layer1.layer.top;
    const selection1Left = layer1.layer.left;
    const selection1Right = layer1.layer.width + selection1Left - 1;
    const selection1Bottom = layer1.layer.height + selection1Up - 1;

    const selection2Up = layer2.layer.top;
    const selection2Left = layer2.layer.left;
    const selection2Right = layer2.layer.width + selection2Left - 1;
    const selection2Bottom = layer2.layer.height + selection2Up - 1;

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

        const index1 = (column - selection1Left) * 4 + (row - selection1Up) * layer1.layer.width * 4;
        const index2 = (column - selection2Left) * 4 + (row - selection2Up) * layer2.layer.width * 4;

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
