import WorldBuildingPlugin from "./main";

// CSV Classes that can be loaded easily
export class PopulationDensity {
  descriptor: string;
  minPopulation: number;
  maxPopulation: number;
  areaUnit: string;

  constructor(rowData: string[]) {
    this.descriptor = rowData[0];
    this.minPopulation = parseFloat(rowData[1]);
    this.maxPopulation = parseFloat(rowData[2]);
    this.areaUnit = rowData[3];
  }
}

export class SettlementType {
  type: string;
  description: string;
  distributionType: string;
  minPopulation: number;
  maxPopulation: number;

  constructor(rowData: string[]) {
    this.type = rowData[0];
    this.description = rowData[1];
    this.distributionType = rowData[2];
    this.minPopulation = parseFloat(rowData[3]);
    this.maxPopulation = parseFloat(rowData[4]);
  }
}

export class Name {
  name: string;
  gender: string;
  origin: string;
  meanings: string[];
  tags: string[];

  constructor(dataRow: string[]) {
    this.name = dataRow[1];
    this.gender = dataRow[2];
    this.origin = dataRow[3];
    this.meanings = dataRow[4].split("|");
    this.tags = dataRow[5].split("|");
  }
}

export class Profession {
  name: string;
  description: string;
  category: string;
  supportValue: number;

  constructor(dataRow: string[]) {
    this.name = dataRow[0];
    this.description = dataRow[1];
    this.category = dataRow[2];
    this.supportValue = parseFloat(dataRow[3]);
  }
}

export class TravelMethod {
  mode: string;
  subMode: string;
  terrainDifficulty: string;
  encumbrance: string;
  maxLoadLb: number;
  maxLoadKg: number;
  maxDistanceMi: number;
  maxDistanceKm: number;

  constructor(dataRow: string[]) {
    this.mode = dataRow[0];
    this.subMode = dataRow[1];
    this.terrainDifficulty = dataRow[2];
    this.encumbrance = dataRow[3];
    this.maxLoadLb = parseFloat(dataRow[4]);
    this.maxLoadKg = parseFloat(dataRow[5]);
    this.maxDistanceMi = parseFloat(dataRow[6]);
    this.maxDistanceKm = parseFloat(dataRow[7]);
  }
}

export class ConversionFactor {
  toUnit: string;
  factor: number;

  constructor(data: any) {
    this.toUnit = data.toUnit;
    this.factor = data.factor;
  }
}

export class Unit {
  name: string;
  symbol: string;
  conversionFactors: ConversionFactor[];

  constructor(data: any) {
    this.name = data.name;
    this.symbol = data.symbol;
    this.conversionFactors = data.conversionFactors.map((cf: any) => new ConversionFactor(cf));
  }
}

import { CSVUtils } from "./util/csv";
import firstNameDataBase64 from "../resources/Data/First Names.csv";
import lastNameDataBase64 from "../resources/Data/Last Names.csv";
import populationDensityDataBase64 from "../resources/Data/Population Densities.csv";
import professionDataBase64 from "../resources/Data/Professions.csv";
import settlementTypeDataBase64 from "../resources/Data/Settlement Types.csv";
import travelMethodDataBase64 from "../resources/Data/Travel Methods.csv";

// CSV Data Files
export const defaultFirstNameData: Readonly<Name[]> = CSVUtils.parseCSVString(atob(firstNameDataBase64)).map(
  (row) => new Name(row)
);

export const defaultLastNameData: Readonly<Name[]> = CSVUtils.parseCSVString(atob(lastNameDataBase64)).map(
  (row) => new Name(row)
);

export const defaultPopulationDensityData: Readonly<PopulationDensity[]> = CSVUtils.parseCSVString(
  atob(populationDensityDataBase64)
).map((row) => new PopulationDensity(row));

export const defaultProfessionData: Readonly<Profession[]> = CSVUtils.parseCSVString(atob(professionDataBase64)).map(
  (row) => new Profession(row)
);

export const defaultSettlementData: Readonly<SettlementType[]> = CSVUtils.parseCSVString(
  atob(settlementTypeDataBase64)
).map((row) => new SettlementType(row));

export const defaultTravelMethods: Readonly<TravelMethod[]> = CSVUtils.parseCSVString(atob(travelMethodDataBase64)).map(
  (row) => new TravelMethod(row)
);

import unitConversionDataBase64 from "../resources/Data/Unit Conversions.yaml";
import { parse } from "yaml";

// YAML Data Files
export const defaultUnitConversionData: Readonly<Unit[]> = parse(atob(unitConversionDataBase64)).units.map(
  (data: any) => new Unit(data)
);

export function exportDefaultData(plugin: WorldBuildingPlugin, exportPath: string = "") {
  CSVUtils.saveCSVByPath(
    exportPath + "Default First Names Data.csv",
    defaultFirstNameData as unknown[],
    plugin.app.vault,
    {
      header: true,
    }
  );

  CSVUtils.saveCSVByPath(
    exportPath + "Default Last Names Data.csv",
    defaultLastNameData as unknown[],
    plugin.app.vault,
    {
      header: true,
    }
  );

  CSVUtils.saveCSVByPath(
    exportPath + "Default Population Density Data.csv",
    defaultPopulationDensityData as unknown[],
    plugin.app.vault,
    {
      header: true,
    }
  );

  CSVUtils.saveCSVByPath(
    exportPath + "Default Professions Data.csv",
    defaultProfessionData as unknown[],
    plugin.app.vault,
    {
      header: true,
    }
  );

  CSVUtils.saveCSVByPath(
    exportPath + "Default Settlement Types Data.csv",
    defaultSettlementData as unknown[],
    plugin.app.vault,
    {
      header: true,
    }
  );

  CSVUtils.saveCSVByPath(
    exportPath + "Default Travel Methods Data.csv",
    defaultTravelMethods as unknown[],
    plugin.app.vault,
    {
      header: true,
    }
  );

  plugin.frontMatterManager.writeFile(exportPath + "Default Unit Conversion Data.md", {
    units: defaultUnitConversionData,
  });
}
