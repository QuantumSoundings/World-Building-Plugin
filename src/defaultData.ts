import WorldBuildingPlugin from "./main";

// CSV Classes that can be loaded easily
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

  constructor(data: string[] | SettlementType | null) {
    if (data instanceof SettlementType) {
      this.type = data.type;
      this.description = data.description;
      this.distributionType = data.distributionType;
      this.minPopulation = data.minPopulation;
      this.maxPopulation = data.maxPopulation;
    } else if (data instanceof Array) {
      this.type = data[0];
      this.description = data[1];
      this.distributionType = data[2];
      this.minPopulation = parseFloat(data[3]);
      this.maxPopulation = parseFloat(data[4]);
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

import { CSVUtils } from "./util/csv";
import firstNameDataBase64 from "../resources/Datasets/First Names.csv";
import lastNameDataBase64 from "../resources/Datasets/Last Names.csv";
import populationDensityDataBase64 from "../resources/Datasets/Population Densities.csv";
import professionDataBase64 from "../resources/Datasets/Professions.csv";
import settlementTypeDataBase64 from "../resources/Datasets/Settlement Types.csv";
import travelMethodDataBase64 from "../resources/Datasets/Travel Methods.csv";

// CSV Data Files
export const defaultFirstNameData: Readonly<Name[]> = CSVUtils.csvParse(atob(firstNameDataBase64), true).map(
  (row) => new Name(row)
);

export const defaultLastNameData: Readonly<Name[]> = CSVUtils.csvParse(atob(lastNameDataBase64), true).map(
  (row) => new Name(row)
);

export const defaultPopulationDensityData: Readonly<PopulationDensity[]> = CSVUtils.csvParse(
  atob(populationDensityDataBase64),
  true
).map((row) => new PopulationDensity(row));

export const defaultProfessionData: Readonly<Profession[]> = CSVUtils.csvParse(atob(professionDataBase64), true).map(
  (row) => new Profession(row)
);

export const defaultSettlementData: Readonly<SettlementType[]> = CSVUtils.csvParse(
  atob(settlementTypeDataBase64),
  true
).map((row) => new SettlementType(row));

export const defaultTravelMethods: Readonly<TravelMethod[]> = CSVUtils.csvParse(atob(travelMethodDataBase64), true).map(
  (row) => new TravelMethod(row)
);

import unitConversionDataBase64 from "../resources/Datasets/Unit Conversions.yaml";
import { Notice, TFile, parseYaml } from "obsidian";

// YAML Data Files
export const defaultUnitConversionData: Readonly<Unit[]> = parseYaml(atob(unitConversionDataBase64)).units.map(
  (data: any) => new Unit(data)
);

export function exportDefaultData(plugin: WorldBuildingPlugin, exportPath: string = "") {
  const aFile = plugin.app.vault.getAbstractFileByPath(exportPath);
  if (aFile === null || aFile instanceof TFile) {
    new Notice("The export path is a file and not a folder. Please enter a valid folder path.");
    return;
  }

  const path = aFile.path + "/";

  CSVUtils.writeCSVByPath(path + "Default First Names Data.csv", defaultFirstNameData as unknown[], plugin.app.vault, {
    header: true,
  });

  CSVUtils.writeCSVByPath(path + "Default Last Names Data.csv", defaultLastNameData as unknown[], plugin.app.vault, {
    header: true,
  });

  CSVUtils.writeCSVByPath(
    path + "Default Population Density Data.csv",
    defaultPopulationDensityData as unknown[],
    plugin.app.vault,
    {
      header: true,
    }
  );

  CSVUtils.writeCSVByPath(path + "Default Professions Data.csv", defaultProfessionData as unknown[], plugin.app.vault, {
    header: true,
  });

  CSVUtils.writeCSVByPath(
    path + "Default Settlement Types Data.csv",
    defaultSettlementData as unknown[],
    plugin.app.vault,
    {
      header: true,
    }
  );

  CSVUtils.writeCSVByPath(
    path + "Default Travel Methods Data.csv",
    defaultTravelMethods as unknown[],
    plugin.app.vault,
    {
      header: true,
    }
  );

  plugin.frontMatterManager.writeFile(path + "Default Unit Conversion Data.md", {
    units: defaultUnitConversionData,
  });
}
