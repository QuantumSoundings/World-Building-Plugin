import WorldBuildingPlugin from "src/main";

class PopulationDensityData {
    descriptor: string;
    min_population: number;
    max_population: number;
    areaUnit: string;
}

export class PopulationAPI {
    plugin: WorldBuildingPlugin;
    populationDensityData: PopulationDensityData[];

    constructor(plugin: WorldBuildingPlugin) {
        this.plugin = plugin;
    }

    reloadData() {
        this.populationDensityData = [];
        const csvData = this.plugin.csvManager.getCSVData(this.plugin.settings.populationDensityData);
        console.log(csvData);
        for (let i = 1; i < csvData.length; i++) {
            const populationDensity = new PopulationDensityData();
            populationDensity.descriptor = csvData[i][0];
            populationDensity.min_population = Number(csvData[i][1]);
            populationDensity.max_population = Number(csvData[i][2]);
            populationDensity.areaUnit = csvData[i][3];
            this.populationDensityData.push(populationDensity);
        }
    }

    getDescriptorForPopulation(populationDensity: number, areaUnit: string) {
        const unitConversionAPI = this.plugin.getUnitConversionAPI();
        for (const density of this.populationDensityData)
        {
            let min = density.min_population;
            let max = density.max_population;
            if (density.areaUnit !== areaUnit) {
                const convertedMin = unitConversionAPI.convertUnit(density.min_population, density.areaUnit, areaUnit);
                const convertedMax = unitConversionAPI.convertUnit(density.max_population, density.areaUnit, areaUnit);
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