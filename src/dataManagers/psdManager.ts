import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import Psd, { Layer } from "@webtoon/psd";
import { CacheManager } from "./cacheManager";

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

  override async writeFile<Content>(fullPath: string, content: Content) {
    // No-op for now.
  }

  override isFileManageable(file: TAbstractFile): boolean {
    if (file.name.endsWith(".psd")) {
      return true;
    }
    return false;
  }

  private async parsePsd(fullPath: string, psd: Psd): Promise<PsdData> {
    const psdData = new PsdData();
    psdData.file = psd;

    for (const node of psd.children) {
      if (node.type === "Group" && node.name === "Political") {
        const mapData: MapData = new MapData();
        mapData.height = psdData.file.height;
        mapData.width = psdData.file.width;
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
        psdData.mapData = mapData;
      }
    }

    const newFilePath = fullPath.replace(".psd", ".md");
    this.plugin.yamlManager.writeFile(newFilePath, psdData.mapData);
    return psdData;
  }

  private countPixels(pixels: Uint8ClampedArray): number {
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] !== 0) {
        count++;
      }
    }
    return count;
  }
}
