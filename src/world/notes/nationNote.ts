import WorldBuildingPlugin from "src/main";
import { WB_NOTE_PROP_NAME, WBNote } from "./wbNote";
import { TFile } from "obsidian";
import { FMUtils } from "src/util/frontMatterUtils";
import { Logger } from "src/util/Logger";
import { MapUtils } from "src/util/mapUtils";
import type { Distribution } from "src/types/frontMatterTypes";

export class NationNote extends WBNote {
  // Front Matter Configuration Values
  geography: {
    size: number;
    landFertility: number;
    cultivatedLandPercentage: number;
    territories: {
      type: string;
      value: number;
      parentTerritory: string;
    }[];
    settlements: Distribution[];
  };

  // Other values
  useMapSize: boolean;
  population: number;

  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    super(plugin, file);
  }

  public override async update() {
    const frontMatter = await this.plugin.frontMatterManager.getFrontMatterReadOnly(this.file.path);
    if (FMUtils.validateWBNoteType(frontMatter)) {
      this.wbNoteType = frontMatter[WB_NOTE_PROP_NAME];
      if (
        FMUtils.checkForProperty(frontMatter, "geography") &&
        FMUtils.checkForProperty(frontMatter.geography, "size") &&
        FMUtils.checkForProperty(frontMatter.geography, "landFertility") &&
        FMUtils.checkForProperty(frontMatter.geography, "cultivatedLandPercentage") &&
        FMUtils.checkForProperty(frontMatter.geography, "territories") &&
        FMUtils.checkForProperty(frontMatter.geography, "settlements")
      ) {
        if (typeof frontMatter.geography.size === "string") {
          if (frontMatter.geography.size.toLowerCase() === "map") {
            this.useMapSize = true;
            frontMatter.geography.size = 0;
          }
        }
        this.geography = {
          size: frontMatter.geography.size,
          landFertility: frontMatter.geography.landFertility,
          cultivatedLandPercentage: frontMatter.geography.cultivatedLandPercentage,
          territories: frontMatter.geography.territories,
          settlements: frontMatter.geography.settlements,
        };
        this.calculateMapSize();
        this.calculatePopulation();
      }
    }
  }

  private calculateMapSize() {
    if (this.useMapSize) {
      const nationData = this.plugin.configManager.configs.nations.values.find(
        (predicate) => predicate.nationName === this.name
      );
      if (nationData === undefined) {
        Logger.error(this, "Nation Data not found.");
        return;
      }
      const map = this.plugin.configManager.configs.mapConfigurations.values.find(
        (predicate) => predicate.mapName === nationData.mapName
      );
      if (map === undefined) {
        Logger.error(this, "Map Configuration not found.");
        return;
      }
      this.geography.size = MapUtils.calculateArea(map, nationData.nationSizePercent);
    }
  }

  private calculatePopulation() {
    // Population Information
    const size = this.geography.size;
    const cultivatedLand = size * (this.geography.cultivatedLandPercentage / 100.0);
    const landFertility = this.geography.landFertility;

    this.population = cultivatedLand * landFertility;
  }
}
