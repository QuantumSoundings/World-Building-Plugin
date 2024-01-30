import { Type, plainToClass } from "class-transformer";

export function convertToCountry(input: any): Country {
  return plainToClass(Country, input);
}

export class Country {
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

  @Type(() => TerritoryGeneration)
  generation: TerritoryGeneration;

  sizeUnit: string;
  parent: string;
}

export class TerritoryGeneration {
  method: string;

  @Type(() => Number)
  averageSize: number;

  @Type(() => Number)
  averagePopulation: number;
}
