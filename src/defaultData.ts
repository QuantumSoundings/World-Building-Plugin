import { PopulationDensity } from "./api/populationApi";
import { SettlementType } from "./api/settlementApi";
import { Unit } from "./api/unitConversionApi";
import WorldBuildingPlugin from "./main";

export function exportDefaultData(plugin: WorldBuildingPlugin, exportPath: string = "") {
  plugin.csvManager.writeFile(exportPath + "Default Population Density Data.csv", defaultPopulationDensityData, {
    header: true,
  });
  plugin.csvManager.writeFile(exportPath + "Default Settlement Types Data.csv", defaultSettlementData, {
    header: true,
  });
  plugin.frontMatterManager.writeFile(exportPath + "Default Unit Conversion Data.md", {
    units: defaultUnitConversionData,
  });
}

export const defaultPopulationDensityData: Readonly<PopulationDensity[]> = [
  { descriptor: "Uninhabited", minPopulation: 0, maxPopulation: 10, areaUnit: "mile^2" },
  { descriptor: "Inhospitable", minPopulation: 10, maxPopulation: 20, areaUnit: "mile^2" },
  { descriptor: "Arid", minPopulation: 20, maxPopulation: 40, areaUnit: "mile^2" },
  { descriptor: "Adequate", minPopulation: 40, maxPopulation: 60, areaUnit: "mile^2" },
  { descriptor: "Ample", minPopulation: 60, maxPopulation: 80, areaUnit: "mile^2" },
  { descriptor: "Abundant", minPopulation: 80, maxPopulation: 100, areaUnit: "mile^2" },
  { descriptor: "Fertile", minPopulation: 100, maxPopulation: 120, areaUnit: "mile^2" },
  { descriptor: "Idyllic", minPopulation: 120, maxPopulation: 99999, areaUnit: "mile^2" },
];

export const defaultSettlementData: Readonly<SettlementType[]> = [
  {
    type: "Isolated",
    description: "Comprised of outlaws, traveling merchants, adventurers, isolated families, etc.",
    distributionType: "gaussian",
    minPopulation: 1,
    maxPopulation: 20,
  },
  {
    type: "Village",
    description: "A small self sufficient community of people.",
    distributionType: "gaussian",
    minPopulation: 20,
    maxPopulation: 1000,
  },
  {
    type: "Town",
    description: "A mid sized community of people.",
    distributionType: "gaussian",
    minPopulation: 1000,
    maxPopulation: 5000,
  },
  {
    type: "City",
    description: "A large community of people.",
    distributionType: "gaussian",
    minPopulation: 5000,
    maxPopulation: 15000,
  },
  {
    type: "Big City",
    description: "A very large community of people.",
    distributionType: "gaussian",
    minPopulation: 15000,
    maxPopulation: 25000,
  },
  {
    type: "Metropolis",
    description: "A massive community of people.",
    distributionType: "gaussian",
    minPopulation: 25000,
    maxPopulation: 250000,
  },
];

export const defaultUnitConversionData: Readonly<Unit[]> = [
  {
    name: "feet",
    symbol: "ft",
    conversionFactors: [
      {
        toUnit: "mile",
        factor: 0.00018939393939394,
      },
      {
        toUnit: "meter",
        factor: 0.3048,
      },
      {
        toUnit: "kilometer",
        factor: 0.0003048,
      },
    ],
  },
  {
    name: "mile",
    symbol: "mi",
    conversionFactors: [
      {
        toUnit: "feet",
        factor: 5280,
      },
      {
        toUnit: "meter",
        factor: 1609.344,
      },
      {
        toUnit: "kilometer",
        factor: 1.609344,
      },
    ],
  },
  {
    name: "meter",
    symbol: "m",
    conversionFactors: [
      {
        toUnit: "feet",
        factor: 3.2808398950131,
      },
      {
        toUnit: "mile",
        factor: 62137119223733e-17,
      },
      {
        toUnit: "kilometer",
        factor: 1e-3,
      },
    ],
  },
  {
    name: "kilometer",
    symbol: "km",
    conversionFactors: [
      {
        toUnit: "feet",
        factor: 3280.8398950131,
      },
      {
        toUnit: "mile",
        factor: 0.62137119223733,
      },
      {
        toUnit: "meter",
        factor: 1e3,
      },
    ],
  },
  {
    name: "feet^2",
    symbol: "ft^2",
    conversionFactors: [
      {
        toUnit: "mile^2",
        factor: 35870064279654e-21,
      },
      {
        toUnit: "meter^2",
        factor: 0.09290304,
      },
      {
        toUnit: "kilometer^2",
        factor: 9290304e-14,
      },
      {
        toUnit: "acre",
        factor: 22956841138659e-18,
      },
      {
        toUnit: "hectare",
        factor: 9290304e-12,
      },
    ],
  },
  {
    name: "mile^2",
    symbol: "mi",
    conversionFactors: [
      {
        toUnit: "feet^2",
        factor: 27878399999612e-6,
      },
      {
        toUnit: "meter^2",
        factor: 25899881103e-4,
      },
      {
        toUnit: "kilometer^2",
        factor: 2.5899881103,
      },
      {
        toUnit: "acre",
        factor: 639.9999999911,
      },
      {
        toUnit: "hectare",
        factor: 258.99881103,
      },
    ],
  },
  {
    name: "meter^2",
    symbol: "m^2",
    conversionFactors: [
      {
        toUnit: "feet^2",
        factor: 10.76391041671,
      },
      {
        toUnit: "mile^2",
        factor: 38610215854781e-20,
      },
      {
        toUnit: "kilometer^2",
        factor: 1e-3,
      },
      {
        toUnit: "acre",
        factor: 24710538146717e-17,
      },
      {
        toUnit: "hectare",
        factor: 1e-4,
      },
    ],
  },
  {
    name: "kilometer^2",
    symbol: "km^2",
    conversionFactors: [
      {
        toUnit: "feet^2",
        factor: 1076391041671e-5,
      },
      {
        toUnit: "mile^2",
        factor: 0.38610215854781,
      },
      {
        toUnit: "meter^2",
        factor: 1e6,
      },
      {
        toUnit: "acre",
        factor: 247.10538146717,
      },
      {
        toUnit: "hectare",
        factor: 100,
      },
    ],
  },
  {
    name: "acre",
    symbol: "ac",
    conversionFactors: [
      {
        toUnit: "feet^2",
        factor: 43560,
      },
      {
        toUnit: "mile^2",
        factor: 0.0015625000000217,
      },
      {
        toUnit: "meter^2",
        factor: 4046.8564224,
      },
      {
        toUnit: "kilometer^2",
        factor: 0.0040468564224,
      },
      {
        toUnit: "hectare",
        factor: 0.40468564224,
      },
    ],
  },
  {
    name: "hectare",
    symbol: "ha",
    conversionFactors: [
      {
        toUnit: "feet^2",
        factor: 107639.1041671,
      },
      {
        toUnit: "mile^2",
        factor: 0.0038610215854781,
      },
      {
        toUnit: "meter^2",
        factor: 1e4,
      },
      {
        toUnit: "kilometer^2",
        factor: 0.01,
      },
      {
        toUnit: "acre",
        factor: 2.4710538146717,
      },
    ],
  },
];
