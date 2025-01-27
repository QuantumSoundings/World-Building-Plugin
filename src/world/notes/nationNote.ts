import WorldBuildingPlugin from "src/main";
import { WBNote } from "./wbNote";
import { TFile } from "obsidian";
import { Logger } from "src/util/Logger";
import { MapUtils } from "src/util/mapUtils";
import { NationSchema, type Distribution, type NationFM, type NonLivingDates } from "src/types/frontMatterTypes";
import { fromError } from "zod-validation-error";

export class NationNote extends WBNote {
  dates: NonLivingDates;
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

  // Calculated Values
  useMapSize: boolean;
  population: number;

  constructor(plugin: WorldBuildingPlugin, file: TFile, fm: unknown) {
    super(plugin, file, fm);
  }

  public override update() {
    super.update();
    const result = NationSchema.safeParse(this.fm);
    if (result.success) {
      const fm: NationFM = result.data;
      this.wbNoteType = fm.wbNoteType;
      this.dates = this.parseDates(fm.dates);
      if (typeof fm.geography.size === "string" && fm.geography.size.toLowerCase() === "map") {
        this.useMapSize = true;
        fm.geography.size = 0;
      }
      this.geography = {
        size: fm.geography.size as number,
        landFertility: fm.geography.landFertility,
        cultivatedLandPercentage: fm.geography.cultivatedLandPercentage,
        territories: fm.geography.territories,
        settlements: fm.geography.settlements,
      };
      this.calculateMapSize();
      this.calculatePopulation();
    } else {
      this.error = fromError(result.error).toString();
    }
  }

  private calculateMapSize() {
    if (this.useMapSize) {
      const nationData = this.plugin.configManager.configs.nations.values.find(
        (predicate) => predicate.nationName === this.name
      );
      if (nationData === undefined) {
        Logger.error(this, `Nation data not found for ${this.name}.`);
        return;
      }
      const map = this.plugin.configManager.configs.mapConfigurations.values.find(
        (predicate) => predicate.mapName === nationData.mapName
      );
      if (map === undefined) {
        Logger.error(this, `Map Configuration not found for ${nationData.mapName}.`);
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
