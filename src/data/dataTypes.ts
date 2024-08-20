export class PopulationDensity {
  descriptor: string;
  minPopulation: number;
  maxPopulation: number;
  areaUnit: string;

  constructor(data: string[] | PopulationDensity | null) {
    if (data instanceof PopulationDensity) {
      this.descriptor = data.descriptor;
      this.minPopulation = data.minPopulation;
      this.maxPopulation = data.maxPopulation;
      this.areaUnit = data.areaUnit;
    } else if (data instanceof Array) {
      this.descriptor = data[0];
      this.minPopulation = parseFloat(data[1]);
      this.maxPopulation = parseFloat(data[2]);
      this.areaUnit = data[3];
    }
  }
}

export class SettlementType {
  type: string;
  description: string;
  distributionType: string;
  minPopulation: number;
  maxPopulation: number;
  mapIcon: string;

  constructor(data: string[] | SettlementType | null) {
    if (data instanceof SettlementType) {
      this.type = data.type;
      this.description = data.description;
      this.distributionType = data.distributionType;
      this.minPopulation = data.minPopulation;
      this.maxPopulation = data.maxPopulation;
      this.mapIcon = data.mapIcon;
    } else if (data instanceof Array) {
      this.type = data[0];
      this.description = data[1];
      this.distributionType = data[2];
      this.minPopulation = parseFloat(data[3]);
      this.maxPopulation = parseFloat(data[4]);
      this.mapIcon = data[5];
    }
  }
}

export class Name {
  unicodeName: string;
  name: string;
  gender: string;
  origin: string;
  meanings: string[];
  tags: string[];

  constructor(data: string[] | Name | null) {
    if (data instanceof Name) {
      this.unicodeName = data.unicodeName;
      this.name = data.name;
      this.gender = data.gender;
      this.origin = data.origin;
      this.meanings = data.meanings;
      this.tags = data.tags;
    } else if (data instanceof Array) {
      this.unicodeName = data[0];
      this.name = data[1];
      this.gender = data[2];
      this.origin = data[3];
      this.meanings = data[4].split("|");
      this.tags = data[5].split("|");
    }
  }
}

export class Profession {
  name: string;
  description: string;
  category: string;
  supportValue: number;

  constructor(data: string[] | Profession | null) {
    if (data instanceof Profession) {
      this.name = data.name;
      this.description = data.description;
      this.category = data.category;
      this.supportValue = data.supportValue;
    } else if (data instanceof Array) {
      this.name = data[0];
      this.description = data[1];
      this.category = data[2];
      this.supportValue = parseFloat(data[3]);
    }
  }
}

export class TravelMethod {
  mode: string;
  subMode: string;
  terrainDifficulty: string;
  encumbrance: string;
  maxLoad: number;
  weightUnit: string;
  maxDistance: number;
  distanceUnit: string;

  constructor(data: string[] | TravelMethod | null) {
    if (data instanceof TravelMethod) {
      this.mode = data.mode;
      this.subMode = data.subMode;
      this.terrainDifficulty = data.terrainDifficulty;
      this.encumbrance = data.encumbrance;
      this.maxLoad = data.maxLoad;
      this.weightUnit = data.weightUnit;
      this.maxDistance = data.maxDistance;
      this.distanceUnit = data.distanceUnit;
    } else if (data instanceof Array) {
      this.mode = data[0];
      this.subMode = data[1];
      this.terrainDifficulty = data[2];
      this.encumbrance = data[3];
      this.maxLoad = parseFloat(data[4]);
      this.weightUnit = data[5];
      this.maxDistance = parseFloat(data[6]);
      this.distanceUnit = data[7];
    }
  }
}

export class TalentRank {
  rank: string;
  perMillionPeople: number;
  constructor(data: string[] | TalentRank | null) {
    if (data instanceof TalentRank) {
      this.rank = data.rank;
      this.perMillionPeople = data.perMillionPeople;
    } else if (data instanceof Array) {
      this.rank = data[0];
      this.perMillionPeople = parseFloat(data[1]);
    }
  }
}

export class ConversionFactor {
  toUnit: string;
  factor: number;

  constructor(data: any | ConversionFactor | null) {
    if (data instanceof ConversionFactor) {
      this.toUnit = data.toUnit;
      this.factor = data.factor;
    } else {
      this.toUnit = data.toUnit;
      this.factor = data.factor;
    }
  }
}

export class Unit {
  name: string;
  symbol: string;
  conversionFactors: ConversionFactor[];

  constructor(data: any | Unit | null) {
    if (data instanceof Unit) {
      this.name = data.name;
      this.symbol = data.symbol;
      this.conversionFactors = data.conversionFactors;
    } else if (data instanceof Object) {
      this.name = data.name;
      this.symbol = data.symbol;
      this.conversionFactors = data.conversionFactors.map((cf: any) => new ConversionFactor(cf));
    }
  }
}

export class MapConfiguration {
  mapName: string;
  unitHeight: number;
  unitWidth: number;
  unit: string;
  geometry: string;

  constructor(data: string[] | MapConfiguration | null) {
    if (data instanceof MapConfiguration) {
      this.mapName = data.mapName;
      this.unitHeight = data.unitHeight;
      this.unitWidth = data.unitWidth;
      this.unit = data.unit;
      this.geometry = data.geometry;
    } else if (data instanceof Array) {
      this.mapName = data[0];
      this.unitHeight = parseFloat(data[1]);
      this.unitWidth = parseFloat(data[2]);
      this.unit = data[3];
      this.geometry = data[4];
    }
  }
}

export class PointOfInterest {
  mapName: string;
  link: string;
  label: string;
  relX: number;
  relY: number;
  mapIcon: string;

  constructor(data: string[] | PointOfInterest | null) {
    if (data instanceof PointOfInterest) {
      this.mapName = data.mapName;
      this.link = data.link;
      this.label = data.label;
      this.relX = data.relX;
      this.relY = data.relY;
      this.mapIcon = data.mapIcon;
    } else if (data instanceof Array) {
      this.mapName = data[0];
      this.link = data[1];
      this.label = data[2];
      this.relX = parseFloat(data[3]);
      this.relY = parseFloat(data[4]);
      this.mapIcon = data[5];
    }
  }
}

export class NationData {
  mapName: string;
  nationName: string;
  nationSizePercent: number;

  constructor(data: string[] | NationData | null) {
    if (data instanceof NationData) {
      this.mapName = data.mapName;
      this.nationName = data.nationName;
      this.nationSizePercent = data.nationSizePercent;
    } else if (data instanceof Array) {
      this.mapName = data[0];
      this.nationName = data[1];
      this.nationSizePercent = parseFloat(data[2]);
    }
  }
}
