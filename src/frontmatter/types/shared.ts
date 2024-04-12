export interface BaseConfiguration {
  name: string;
}

export interface Distribution {
  name: string;
  value: number;
}

export interface Datasets {
  territories: string;
  settlements: string;
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
