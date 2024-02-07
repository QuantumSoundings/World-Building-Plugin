import { Type, plainToClass } from "class-transformer";

export function convertToSovereignEntityFM(input: any): SovereignEntityFM {
  return plainToClass(SovereignEntityFM, input);
}

export class SovereignEntityFM {
  name: string;
  id: string;

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

  version: string;
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

export class Distribution {
  name: string;

  @Type(() => Number)
  value: number;
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