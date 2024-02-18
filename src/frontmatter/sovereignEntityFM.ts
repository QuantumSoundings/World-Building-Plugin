import { Type, plainToClass } from "class-transformer";
import { Datasets, Distribution, WBMetaData } from "./sharedFM";

export function convertToSovereignEntityFM(input: any): SovereignEntityFM {
  return plainToClass(SovereignEntityFM, input);
}

export class SovereignEntityFM {
  name: string;

  @Type(() => Geography)
  geography: Geography;

  @Type(() => Demographics)
  demographics: Demographics;

  @Type(() => Culture)
  culture: Culture;

  @Type(() => Distribution)
  species: Distribution[];
  @Type(() => Distribution)
  languages: Distribution[];

  @Type(() => Datasets)
  staticDatasets: Datasets;

  @Type(() => WBMetaData)
  wbMeta: WBMetaData;
}

export class Geography {
  @Type(() => Number)
  size: number;
  sizeUnit: string;

  @Type(() => Number)
  landFertility: number;
  landFertilityUnit: string;

  @Type(() => Number)
  cultivatedLand: number;
  cultivatedLandUnit: string;

  @Type(() => TerritoryGeneration)
  generation: TerritoryGeneration;
  @Type(() => Territory)
  territories: Territory[];

  @Type(() => Distribution)
  settlements: Distribution[];
}

export class Demographics {
  @Type(() => Number)
  lifeExpectancy: number;
  @Type(() => Number)
  populationGrowthRate: number;
}

export class Culture {
  firstNameOrigin: string;
  lastNameOrigin: string;
  territoryNameOrigin: string;
  settlementNameOrigin: string;
}

export class Territory {
  type: string;

  @Type(() => Number)
  value: number;

  parentTerritory: string;
}

export class TerritoryGeneration {
  method: string;
  unit: string;
}

export function upgradeConversion(frontmatter: any): SovereignEntityFM {
  const upgraded = new SovereignEntityFM();

  const version = frontmatter.wbMeta.version as string;
  switch (version) {
    case "0.0.1":
      upgraded.name = frontmatter.name;
      upgraded.geography = frontmatter.geography;
      upgraded.demographics = frontmatter.demographics;
      upgraded.culture = frontmatter.culture;
      upgraded.species = frontmatter.species;
      upgraded.languages = frontmatter.languages;
      upgraded.staticDatasets = frontmatter.staticDatasets;
      upgraded.wbMeta = frontmatter.wbMeta;
      break;
  }

  return upgraded;
}
