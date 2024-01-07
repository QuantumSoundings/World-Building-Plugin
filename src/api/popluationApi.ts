import { defaultPopulationDensityData } from "src/defaultData";
import WorldBuildingPlugin from "src/main";

export class PopulationDensity {
    descriptor: string;
    minPopulation: number;
    maxPopulation: number;
    areaUnit: string;
}

export class PopulationAPI {
    plugin: WorldBuildingPlugin;
    data: PopulationDensity[];

    constructor(plugin: WorldBuildingPlugin) {
        this.plugin = plugin;
        this.data = [];
    }

    private loadDefaultData() {
        this.data = JSON.parse(JSON.stringify(defaultPopulationDensityData));
    }

    reloadData() {
        if (this.plugin.settings.populationDensityData !== '') {
            this.data = [];
            const populationDensityData = this.plugin.csvManager.getCSVData(this.plugin.settings.populationDensityData);
            if (populationDensityData === undefined) {
                console.error("Could not load population data.");
                this.loadDefaultData();
                return;
            }
            console.log("Loading population data from " + this.plugin.settings.populationDensityData + ".");
            for (let i = 1; i < populationDensityData.length; i++) {
                const populationDensity = new PopulationDensity();
                populationDensity.descriptor = populationDensityData[i][0];
                populationDensity.minPopulation = Number(populationDensityData[i][1]);
                populationDensity.maxPopulation = Number(populationDensityData[i][2]);
                populationDensity.areaUnit = populationDensityData[i][3];
                this.data.push(populationDensity);
            }
        }
        else {
            this.loadDefaultData();
        }
    }

    getRawData(): PopulationDensity[] {
        return this.data;
    }

    getDescriptorForPopulation(populationDensity: number, areaUnit: string) {
        const unitConversionAPI = this.plugin.getUnitConversionAPI();
        for (const density of this.data)
        {
            let min = density.minPopulation;
            let max = density.maxPopulation;
            if (density.areaUnit !== areaUnit) {
                const convertedMin = unitConversionAPI.convertUnit(density.minPopulation, density.areaUnit, areaUnit);
                const convertedMax = unitConversionAPI.convertUnit(density.maxPopulation, density.areaUnit, areaUnit);
                if (min === undefined) {
                    console.error('Could not convert population density from ' + density.areaUnit + ' to ' + areaUnit);
                    continue;
                }
                else if (max === undefined) {
                    console.error('Could not convert population density from ' + density.areaUnit + ' to ' + areaUnit);
                    continue;
                }
                else {
                    min = convertedMin as number;
                    max = convertedMax as number;
                }
            }

            if (populationDensity >= min && populationDensity < max) {
                return density.descriptor;
            }
        }
    }
}