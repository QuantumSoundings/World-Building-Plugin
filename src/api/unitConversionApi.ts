import WorldBuildingPlugin from "src/main";

class ConversionFactorData {
    toUnit: string;
    factor: number;
}

class UnitData {
    name: string;
    symbol: string;
    conversionFactors: Map<string, ConversionFactorData>;
}

export class UnitConversionAPI {
    plugin: WorldBuildingPlugin;
    // Map of unit name to unit data
    unitMap: Map<string, UnitData>;

    constructor(plugin: WorldBuildingPlugin) {
        this.plugin = plugin;
        this.unitMap = new Map<string, UnitData>();
    }

    reloadData() {
        this.unitMap.clear();
        const yamlData = this.plugin.yamlManager.getYAMLData(this.plugin.settings.unitConversionData);
        console.log(yamlData);
        for (const unit of yamlData) {
            const unitData = new UnitData();
            unitData.name = unit.name;
            unitData.symbol = unit.symbol;
            unitData.conversionFactors = new Map<string, ConversionFactorData>();
            for (const conversion of unit.conversion_factors) {
                const conversionData = new ConversionFactorData();
                conversionData.toUnit = conversion.toUnit;
                conversionData.factor = conversion.factor;
                unitData.conversionFactors.set(conversion.toUnit, conversionData);
            }
            this.unitMap.set(unit.name, unitData);
        }   
    }

    convertUnit(value: number, fromUnit: string, toUnit: string): number | undefined{
        const fromUnitData = this.unitMap.get(fromUnit);
        if (fromUnitData === undefined) {
            console.error('Could not find unit data for unit: ' + fromUnit);
            return undefined;
        }
        const conversionFactor = fromUnitData.conversionFactors.get(toUnit);
        if (conversionFactor === undefined) {
            console.error('Could not find conversion unit: ' + toUnit);
            return undefined;
        }
        return value * conversionFactor.factor;
    }

}