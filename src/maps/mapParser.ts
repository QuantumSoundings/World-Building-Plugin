import Psd from "@webtoon/psd";
import { TAbstractFile, TFile } from "obsidian";
import { NATIONS_CONFIG_GENERATED, POI_CONFIG_GENERATED } from "src/constants";
import { NationData, PointOfInterest } from "src/data/dataTypes";
import WorldBuildingPlugin from "src/main";
import { CSVUtils } from "src/util/csv";
import { PSDUtils } from "src/util/psd";

export class MapParser {
  plugin: WorldBuildingPlugin;

  // Outputs
  parsedMaps: NationData[] = [];
  parsedPointsOfInterest: PointOfInterest[] = [];

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }

  public async parseAllMaps() {
    this.parsedMaps = [];
    this.parsedPointsOfInterest = [];
    const allFiles = this.plugin.app.vault.getAllLoadedFiles();
    for (const file of allFiles) {
      if (file.name.endsWith(".psd")) {
        await this.processPsd(file);
      }
    }
    await this.saveProcessedMaps();
  }

  private async processPsd(file: TAbstractFile) {
    const binaryContent = await this.plugin.app.vault.readBinary(file as TFile);
    const psd = Psd.parse(binaryContent);

    const groupedLayers = await PSDUtils.getGroupedLayers(psd);
    groupedLayers.pointsOfInterest.forEach((poi) => (poi.mapName = file.name));
    this.parsedPointsOfInterest.push(...groupedLayers.pointsOfInterest);

    for (const politicalLayer of groupedLayers.politicalLayers) {
      const nationData = new NationData(null);
      nationData.nationName = politicalLayer.layer.name;
      const rawPixelCount = await PSDUtils.findLayerIntersection(
        groupedLayers.baseLayer,
        politicalLayer,
        psd.width,
        psd.height
      );
      nationData.nationSizePercent = rawPixelCount / (psd.width * psd.height);
      nationData.mapName = file.name;
      this.parsedMaps.push(nationData);
    }
  }

  private async saveProcessedMaps() {
    CSVUtils.writeCSVByPath(
      `${this.plugin.settings.generatedFilesPath}/${NATIONS_CONFIG_GENERATED}`,
      this.parsedMaps,
      this.plugin.app.vault,
      { header: true }
    );

    CSVUtils.writeCSVByPath(
      `${this.plugin.settings.generatedFilesPath}/${POI_CONFIG_GENERATED}`,
      this.parsedPointsOfInterest,
      this.plugin.app.vault,
      { header: true }
    );
  }
}
