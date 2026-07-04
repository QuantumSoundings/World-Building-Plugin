import Psd from "@webtoon/psd";
import { TAbstractFile, TFile } from "obsidian";
import { GEOGRAPHY_CONFIG_GENERATED, NATIONS_CONFIG_GENERATED, POI_CONFIG_GENERATED } from "src/constants";
import { MapConfiguration, NationData, PointOfInterest } from "src/types/dataTypes";
import WorldBuildingPlugin from "src/main";
import { CSVUtils } from "src/util/csvUtils";
import { PSDUtils } from "src/util/psdUtils";

export class MapParser {
  plugin: WorldBuildingPlugin;

  // Outputs
  parsedNations: NationData[] = [];
  parsedPointsOfInterest: PointOfInterest[] = [];
  parsedGeography: NationData[] = [];

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }

  public async parseAllMaps(mapConfigs: MapConfiguration) {
    this.parsedNations = [];
    this.parsedPointsOfInterest = [];
    this.parsedGeography = [];
    const allFiles = this.plugin.app.vault.getAllLoadedFiles();
    for (const file of allFiles) {
      if (file.path.contains(this.plugin.settings.mapFilesPath) && file.name.endsWith(".psd")) {
        await this.processPsd(
          file,
          mapConfigs.find((value) => value.mapName === file.name),
        );
      }
    }
    await this.saveProcessedMaps();
  }

  private async processPsd(file: TAbstractFile, mapConfig: MapConfiguration | undefined) {
    const binaryContent = await this.plugin.app.vault.readBinary(file as TFile);
    const psd = Psd.parse(binaryContent);

    const groupedLayers = await PSDUtils.getGroupedLayers(psd);
    groupedLayers.pointsOfInterest.forEach((poi) => (poi.mapName = file.name));
    this.parsedPointsOfInterest.push(...groupedLayers.pointsOfInterest);

    for (const politicalLayer of groupedLayers.politicalLayers) {
      const nationData = new NationData(null);
      nationData.nationName = politicalLayer.layer.name;
      const rawPixelCount = PSDUtils.countPixelsForLayer(politicalLayer);
      nationData.nationSizePercent = rawPixelCount / (psd.width * psd.height);
      nationData.nationSizePercentDisplay = (nationData.nationSizePercent * 100).toFixed(3) + "%";
      nationData.mapName = file.name;
      if (mapConfig) {
        const area = mapConfig.unitHeight * mapConfig.unitWidth;
        nationData.nationSize = area * nationData.nationSizePercent;
        nationData.unit = mapConfig.unit;
      }
      this.parsedNations.push(nationData);
    }
    for (const geographyLayer of groupedLayers.geographyLayers) {
      const nationData = new NationData(null);
      nationData.nationName = geographyLayer.layer.name;
      const rawPixelCount = PSDUtils.countPixelsForLayer(geographyLayer);
      nationData.nationSizePercent = rawPixelCount / (psd.width * psd.height);
      nationData.nationSizePercentDisplay = (nationData.nationSizePercent * 100).toFixed(3) + "%";
      nationData.mapName = file.name;
      if (mapConfig) {
        const area = mapConfig.unitHeight * mapConfig.unitWidth;
        nationData.nationSize = area * nationData.nationSizePercent;
        nationData.unit = mapConfig.unit;
      }
      this.parsedGeography.push(nationData);
    }
  }

  private async saveProcessedMaps() {
    await CSVUtils.stringifyAndWriteCSVByPath(
      `${this.plugin.settings.generatedFilesPath}/${NATIONS_CONFIG_GENERATED}`,
      this.parsedNations,
      this.plugin.app.vault,
      { header: true },
    );

    await CSVUtils.stringifyAndWriteCSVByPath(
      `${this.plugin.settings.generatedFilesPath}/${POI_CONFIG_GENERATED}`,
      this.parsedPointsOfInterest,
      this.plugin.app.vault,
      { header: true },
    );

    await CSVUtils.stringifyAndWriteCSVByPath(
      `${this.plugin.settings.generatedFilesPath}/${GEOGRAPHY_CONFIG_GENERATED}`,
      this.parsedGeography,
      this.plugin.app.vault,
      { header: true },
    );
  }
}
