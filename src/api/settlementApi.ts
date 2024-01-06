import WorldBuildingPlugin from "src/main";
import { generateGaussianValue } from "src/util";

class SettlementData{
    type: string;
    description: string;
    distribution_type: string;
    min_population: number;
    max_population: number;
}

export class Settlement {
    type: string;
    name: string;
    population: number;
}


export class SettlementAPI {
    plugin: WorldBuildingPlugin;
    data: SettlementData[];

    constructor(plugin: WorldBuildingPlugin) {
        this.plugin = plugin;
    }

    reloadData() {
        this.data = [];
        const csvData = this.plugin.csvManager.getCSVData(this.plugin.settings.settlementData);
        console.log(csvData);
        for (let i = 1; i < csvData.length; i++) {
            const settlement = new SettlementData();
            settlement.type = csvData[i][0];
            settlement.description = csvData[i][1];
            settlement.distribution_type = csvData[i][2];
            settlement.min_population = Number(csvData[i][3]);
            settlement.max_population = Number(csvData[i][4]);
            this.data.push(settlement);
        }
    }

    getRawData(): SettlementData[] {
        return this.data;
    }
    
    findSettlementDataByType(type: string): SettlementData | undefined {
        return this.data.find(settlement => settlement.type === type);
    }

    generateSettlement(type: string): Settlement | undefined {
        const settlementData = this.findSettlementDataByType(type);
        if (settlementData === undefined) {
            console.error('Could not find settlement data for type: ' + type);
            return undefined;
        }
        const settlement = new Settlement();
        settlement.type = settlementData.type;
        //settlement.name = this.generateName(settlementData);
        settlement.population = this.generatePopulation(settlementData);
        return settlement;
    }

    private generatePopulation(settlementData: SettlementData): number {
        switch (settlementData.distribution_type) {
            case 'gaussian': return generateGaussianValue(settlementData.min_population, settlementData.max_population, 1.0)
            default:
                return NaN;
        }
    }
}