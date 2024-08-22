// Config Names
export const MAP_CONFIG = "WB Config - Maps.csv";
export const POINTS_OF_INTEREST_CONFIG = "WB Config - Points of Interest.csv";
export const NATIONS_CONFIG_GENERATED = "Nations Parsed From Maps.csv";
export const POI_CONFIG_GENERATED = "POIs Parsed From Maps.csv";

// Config Base64 Includes
import mapConfigBase64 from "resources/Configs/WB Config - Maps.csv";
import pointsOfInterestConfigBase64 from "resources/Configs/WB Config - Points of Interest.csv";

// Config Strings Decoded
export const mapConfigString = atob(mapConfigBase64);
export const pointsOfInterestConfigString = atob(pointsOfInterestConfigBase64);

// Dataset Names
export const FIRST_NAME_DATASET = "WB Data - First Names.csv";
export const LAST_NAME_DATASET = "WB Data - Last Names.csv";
export const POPULATION_DENSITY_DATASET = "WB Data - Population Densities.csv";
export const PROFESSION_DATASET = "WB Data - Professions.csv";
export const SETTLEMENT_TYPE_DATASET = "WB Data - Settlement Types.csv";
export const TRAVEL_METHOD_DATASET = "WB Data - Travel Methods.csv";
export const TALENT_DATASET = "WB Data - Talent Ranks.csv";
export const UNIT_DATASET = "WB Data - Units.md";

// Dataset Base64 Includes
import firstNameDataBase64 from "resources/Datasets/First Names.csv";
import lastNameDataBase64 from "resources/Datasets/Last Names.csv";
import populationDensityDataBase64 from "resources/Datasets/Population Densities.csv";
import professionDataBase64 from "resources/Datasets/Professions.csv";
import settlementTypeDataBase64 from "resources/Datasets/Settlement Types.csv";
import travelMethodDataBase64 from "resources/Datasets/Travel Methods.csv";
import talentDataBase64 from "resources/Datasets/Talent Ranks.csv";
import unitConversionDataBase64 from "resources/Datasets/Unit Conversions.yaml";

// Dataset Strings Decoded
export const firstNameDataString = atob(firstNameDataBase64);
export const lastNameDataString = atob(lastNameDataBase64);
export const populationDensityDataString = atob(populationDensityDataBase64);
export const professionDataString = atob(professionDataBase64);
export const settlementTypeDataString = atob(settlementTypeDataBase64);
export const travelMethodDataString = atob(travelMethodDataBase64);
export const talentDataString = atob(talentDataBase64);
export const unitConversionDataString = atob(unitConversionDataBase64);

// Template Base64 Includes
import sovereignEntityTemplateBase64 from "resources/Frontmatter Templates/Sovereign Entity.yaml";
import settlementEntityTemplateBase64 from "resources/Frontmatter Templates/Settlement Entity.yaml";
import worldConfigTemplateBase64 from "resources/Frontmatter Templates/World Entity.yaml";

// Template Strings Decoded
export const sovereignEntityTemplateString = atob(sovereignEntityTemplateBase64);
export const settlementEntityTemplateString = atob(settlementEntityTemplateBase64);
export const worldConfigTemplateString = atob(worldConfigTemplateBase64);

export enum TemplateType {
  SovereignEntity = "Sovereign Entity Template",
  SettlementEntity = "Settlement Entity Template",
  WorldConfig = "World Entity Template",
}

export const TEMPLATE_TYPE_LATEST_VERSION = {
  [TemplateType.SovereignEntity]: "0.0.1",
  [TemplateType.SettlementEntity]: "0.0.1",
  [TemplateType.WorldConfig]: "0.0.1",
};

export const TEMPLATES = [TemplateType.SovereignEntity, TemplateType.SettlementEntity, TemplateType.WorldConfig];

export function getTemplateFromType(templateType: TemplateType): string {
  switch (templateType) {
    case TemplateType.SovereignEntity:
      return sovereignEntityTemplateString;
    case TemplateType.SettlementEntity:
      return settlementEntityTemplateString;
    case TemplateType.WorldConfig:
      return worldConfigTemplateString;
    default:
      return "";
  }
}

// View Constants
export const PLUGIN_NAME = "world-building-plugin";
export const CSV_VIEW = "csv-view";
export const WORLD_ENGINE_VIEW = "world-engine-view";

// Hover Link Sources
export const CSV_HOVER_SOURCE = `${PLUGIN_NAME}:${CSV_VIEW}`;
export const WORLD_ENGINE_HOVER_SOURCE = `${PLUGIN_NAME}:${WORLD_ENGINE_VIEW}`;
