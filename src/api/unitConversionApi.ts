import { defaultUnitConversionData } from "src/defaultData";
import WorldBuildingPlugin from "src/main";

export class ConversionFactor {
    toUnit: string;
    factor: number;
}

export class Unit {
    name: string;
    symbol: string;
    conversionFactors: ConversionFactor[];
}

export class UnitConversionAPI {
    plugin: WorldBuildingPlugin;
    data: Unit[];

    constructor(plugin: WorldBuildingPlugin) {
        this.plugin = plugin;
        this.data = [];
    }

    private loadDefaultData() {
        this.data = JSON.parse(JSON.stringify(defaultUnitConversionData));
    }

    reloadData() {
        if (this.plugin.settings.unitConversionData !== '') {
            this.data = [];
            console.log("Loading unit conversion data from " + this.plugin.settings.unitConversionData + ".");
            const unitConversionData = this.plugin.yamlManager.getYAMLData(this.plugin.settings.unitConversionData);
            if (unitConversionData === undefined) {
                console.error("Could not load unit conversion data.");
                this.loadDefaultData();
                return;
            }
            for (const unitData of unitConversionData) {
                const unit = new Unit();
                unit.name = unitData.name;
                unit.symbol = unitData.symbol;
                unit.conversionFactors = [];
                for (const conversionFactorData of unitData.conversionFactors) {
                    const conversionFactor = new ConversionFactor();
                    conversionFactor.toUnit = conversionFactorData.toUnit;
                    conversionFactor.factor = conversionFactorData.factor;
                    unit.conversionFactors.push(conversionFactor);
                }
                this.data.push(unitData);
            }
        }
        else {
            this.loadDefaultData();
        }
    }

    getRawData(): Unit[] {
        return this.data;
    }

    convertUnit(value: number, fromUnit: string, toUnit: string): number | undefined{
        const fromUnitData = this.data.find(unit => unit.name === fromUnit);
        if (fromUnitData === undefined) {
            console.error('Could not find unit data for unit: ' + fromUnit);
            return undefined;
        }
        const conversionFactor = fromUnitData.conversionFactors.find(factor => factor.toUnit === toUnit);
        if (conversionFactor === undefined) {
            console.error('Could not find conversion unit: ' + toUnit);
            return undefined;
        }
        return value * conversionFactor.factor;
    }

    getSymbolForUnit(unitName: string): string | undefined {
        const unitData = this.data.find(unit => unit.name === unitName);
        if (unitData === undefined) {
            console.error('Could not find unit data for unit: ' + unitName);
            return undefined;
        }
        return unitData.symbol;
    }

}