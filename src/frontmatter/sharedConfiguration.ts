export class Distribution {
  name: string;
  value: number;
}

export class WBMetaData {
  type: string;
  version: string;
  id: string;
}

export class Datasets {
  territories: string;
  settlements: string;
}

export class MapInfo {
  name: string;
  xPos: number;
  yPos: number;
}

export interface BaseConfiguration {
  name: string;
}

export interface CultureConfiguration {
  people: CulturePeople;
  places: CulturePlaces;
  things: CultureThings;
}

export interface CulturePeople {
  firstNameOrigin: string;
  lastNameOrigin: string;
}

export interface CulturePlaces {
  territoryNameOrigin: string;
  settlementNameOrigin: string;
}

export interface CultureThings {
  things: string;
}
