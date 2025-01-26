// Config Names
export const MAP_CONFIG = "WB Config - Maps.csv";
export const POINTS_OF_INTEREST_CONFIG = "WB Config - Points of Interest.csv";
export const NATIONS_CONFIG_GENERATED = "Nations Parsed From Maps.csv";
export const POI_CONFIG_GENERATED = "POIs Parsed From Maps.csv";

// Config Base64 Includes
import mapConfigBase64 from "resources/Configs/WB Config - Maps.csv";
import pointsOfInterestConfigBase64 from "resources/Configs/WB Config - Points of Interest.csv";

// Config Strings Decoded
export const mapConfigString = atob(mapConfigBase64 as string);
export const pointsOfInterestConfigString = atob(pointsOfInterestConfigBase64 as string);

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
export const firstNameDataString = atob(firstNameDataBase64 as string);
export const lastNameDataString = atob(lastNameDataBase64 as string);
export const populationDensityDataString = atob(populationDensityDataBase64 as string);
export const professionDataString = atob(professionDataBase64 as string);
export const settlementTypeDataString = atob(settlementTypeDataBase64 as string);
export const travelMethodDataString = atob(travelMethodDataBase64 as string);
export const talentDataString = atob(talentDataBase64 as string);
export const unitConversionDataString = atob(unitConversionDataBase64 as string);

// Template Base64 Includes
import nationTemplateBase64 from "resources/Frontmatter Templates/nation.yaml";
import settlementTemplateBase64 from "resources/Frontmatter Templates/settlement.yaml";
import characterTemplateBase64 from "resources/Frontmatter Templates/characters.yaml";
import proseTemplateBase64 from "resources/Frontmatter Templates/prose.yaml";
import organizationTemplateBase64 from "resources/Frontmatter Templates/organization.yaml";

// Template Strings Decoded
export const nationTemplateString = atob(nationTemplateBase64 as string);
export const settlementTemplateString = atob(settlementTemplateBase64 as string);
export const characterTemplateString = atob(characterTemplateBase64 as string);
export const proseTemplateString = atob(proseTemplateBase64 as string);
export const organizationTemplateString = atob(organizationTemplateBase64 as string);

// Enums
export enum TemplateType {
  NATION = "Nation Template",
  SETTLEMENT = "Settlement Template",
  CHARACTER = "Character Template",
  PROSE = "Prose Template",
  ORGANIZATION = "Organization Template",
}

export enum WBNoteTypeEnum {
  NATION = "nation",
  SETTLEMENT = "settlement",
  CHARACTER = "character",
  PROSE = "prose",
  ORGANIZATION = "organization",
}

export enum WBTalentEnum {
  SSS = "SSS",
  SSS_MINUS = "SSS-",
  SS_PLUS = "SS+",
  SS = "SS",
  SS_MINUS = "SS-",
  S_PLUS = "S+",
  S = "S",
  S_MINUS = "S-",
  A_PLUS = "A+",
  A = "A",
  A_MINUS = "A-",
  B_PLUS = "B+",
  B = "B",
  B_MINUS = "B-",
  C = "C",
  D = "D",
  NONE = "NONE",
  ERROR = "ERROR",
}

export const TEMPLATE_TYPE_LATEST_VERSION = {
  [TemplateType.NATION]: "0.0.1",
  [TemplateType.SETTLEMENT]: "0.0.1",
  [TemplateType.CHARACTER]: "0.0.1",
  [TemplateType.PROSE]: "0.0.1",
  [TemplateType.ORGANIZATION]: "0.0.1",
};

export const TEMPLATES = Object.values(TemplateType);

export function getTemplateFromType(templateType: TemplateType): string {
  switch (templateType) {
    case TemplateType.NATION:
      return nationTemplateString;
    case TemplateType.SETTLEMENT:
      return settlementTemplateString;
    case TemplateType.CHARACTER:
      return characterTemplateString;
    case TemplateType.PROSE:
      return proseTemplateString;
    case TemplateType.ORGANIZATION:
      return organizationTemplateString;
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
