import Psd from "@webtoon/psd";
import { TAbstractFile, TFile } from "obsidian";
import { PointOfInterest } from "src/data/dataTypes";
import WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";
import { PSDUtils } from "src/util/psd";

class NationData {
  name: string;
  percentOfTotalMapArea: number;
  mapName: string;
}

class MapData {
  nationData: NationData[];
  pointsOfInterest: PointOfInterest[];
}

export class MapParser {
  plugin: WorldBuildingPlugin;

  // Outputs
  parsedMaps: MapData[] = [];

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }

  public async parseAllMaps() {
    this.parsedMaps = [];
    const allFiles = this.plugin.app.vault.getAllLoadedFiles();
    for (const file of allFiles) {
      if (file.name.endsWith(".psd")) {
        const data = await this.processPsd(file);
        this.parsedMaps.push(data);
      }
    }
    await this.saveProcessedMaps();
  }

  private async processPsd(file: TAbstractFile): Promise<MapData> {
    const binaryContent = await this.plugin.app.vault.readBinary(file as TFile);
    const psd = Psd.parse(binaryContent);
    const mapData = new MapData();

    const groupedLayers = await PSDUtils.getGroupedLayers(psd);
    groupedLayers.pointsOfInterest.forEach((poi) => (poi.mapName = file.name));
    mapData.pointsOfInterest = groupedLayers.pointsOfInterest;

    mapData.nationData = [];
    for (const politicalLayer of groupedLayers.politicalLayers) {
      const countryData = new NationData();
      countryData.name = politicalLayer.layer.name;
      const rawPixelCount = await PSDUtils.findLayerIntersection(
        groupedLayers.baseLayer,
        politicalLayer,
        psd.width,
        psd.height
      );
      countryData.percentOfTotalMapArea = rawPixelCount / (psd.width * psd.height);
      mapData.nationData.push(countryData);
    }
    const sortBySize = (a: NationData, b: NationData) => {
      return b.percentOfTotalMapArea - a.percentOfTotalMapArea;
    };
    mapData.nationData.sort(sortBySize);
    return mapData;
  }

  private async saveProcessedMaps() {
    const newFilePath = this.plugin.settings.generatedFilesPath + "/processedMaps.md";
    const file = this.plugin.app.vault.getAbstractFileByPath(newFilePath);
    if (file === null) {
      await this.plugin.app.vault.create(newFilePath, "---\n---\n");
    }
    Logger.debug(this, "Writing processed map data for " + newFilePath + ".");
    await this.plugin.frontMatterManager.replaceFrontMatter(newFilePath, this.parsedMaps);
  }
}
