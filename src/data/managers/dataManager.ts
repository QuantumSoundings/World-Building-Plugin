import { TAbstractFile, TFile, TFolder, parseYaml } from "obsidian";
import {
  Name,
  PopulationDensity,
  Profession,
  SettlementType,
  TalentRank,
  TravelMethod,
  Unit,
} from "src/data/dataTypes";
import WorldBuildingPlugin from "src/main";
import {
  FIRST_NAME_DATASET,
  LAST_NAME_DATASET,
  POPULATION_DENSITY_DATASET,
  PROFESSION_DATASET,
  SETTLEMENT_TYPE_DATASET,
  TRAVEL_METHOD_DATASET,
  TALENT_DATASET,
  UNIT_DATASET,
  firstNameDataString,
  unitConversionDataString,
  lastNameDataString,
  populationDensityDataString,
  professionDataString,
  settlementTypeDataString,
  travelMethodDataString,
  talentDataString,
} from "../constants";
import { CSVUtils } from "src/util/csv";
import { parse } from "csv-parse/sync";
import { DataUtils } from "../dataUtils";

interface DatasetInfo<T> {
  datasetName: string;
  default: T[];
  live: T[];
  converter: (data: any) => T;
}

interface Datasets {
  firstName: DatasetInfo<Name>;
  lastName: DatasetInfo<Name>;
  populationDensity: DatasetInfo<PopulationDensity>;
  profession: DatasetInfo<Profession>;
  settlementType: DatasetInfo<SettlementType>;
  travelMethod: DatasetInfo<TravelMethod>;
  talent: DatasetInfo<TalentRank>;
  unit: DatasetInfo<Unit>;
}

export class DataManager {
  plugin: WorldBuildingPlugin;
  datasets: Datasets = {
    firstName: {
      datasetName: FIRST_NAME_DATASET,
      default: [],
      live: [],
      converter: (data: any) => new Name(data),
    },
    lastName: {
      datasetName: LAST_NAME_DATASET,
      default: [],
      live: [],
      converter: (data: any) => new Name(data),
    },
    populationDensity: {
      datasetName: POPULATION_DENSITY_DATASET,
      default: [],
      live: [],
      converter: (data: any) => new PopulationDensity(data),
    },
    profession: {
      datasetName: PROFESSION_DATASET,
      default: [],
      live: [],
      converter: (data: any) => new Profession(data),
    },
    settlementType: {
      datasetName: SETTLEMENT_TYPE_DATASET,
      default: [],
      live: [],
      converter: (data: any) => new SettlementType(data),
    },
    travelMethod: {
      datasetName: TRAVEL_METHOD_DATASET,
      default: [],
      live: [],
      converter: (data: any) => new TravelMethod(data),
    },
    talent: {
      datasetName: TALENT_DATASET,
      default: [],
      live: [],
      converter: (data: any) => new TalentRank(data),
    },
    unit: {
      datasetName: UNIT_DATASET,
      default: [],
      live: [],
      converter: (data: any) => new Unit(data),
    },
  };

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    DataUtils.setPlugin(plugin);
  }

  public async reloadDatasets() {
    this.loadCSVDataset(this.datasets.firstName, firstNameDataString);
    this.loadCSVDataset(this.datasets.lastName, lastNameDataString);
    this.loadCSVDataset(this.datasets.populationDensity, populationDensityDataString);
    this.loadCSVDataset(this.datasets.profession, professionDataString);
    this.loadCSVDataset(this.datasets.settlementType, settlementTypeDataString);
    this.loadCSVDataset(this.datasets.travelMethod, travelMethodDataString);
    this.loadCSVDataset(this.datasets.talent, talentDataString);
    this.loadFMDataset(this.datasets.unit, unitConversionDataString);
  }

  public exportDefaultData() {
    this.writeCSVDataset(this.datasets.firstName);
    this.writeCSVDataset(this.datasets.lastName);
    this.writeCSVDataset(this.datasets.populationDensity);
    this.writeCSVDataset(this.datasets.profession);
    this.writeCSVDataset(this.datasets.settlementType);
    this.writeCSVDataset(this.datasets.travelMethod);
    this.writeCSVDataset(this.datasets.talent);
    this.writeFMDataset(this.datasets.unit);
  }

  public registerEventCallbacks() {
    const modifyEvent = async (file: TAbstractFile) => {
      // Refresh Internal Override Data if it has changed.
      const path = file.path;
      const shouldReload =
        path.includes(this.datasets.firstName.datasetName) ||
        path.includes(this.datasets.lastName.datasetName) ||
        path.includes(this.datasets.populationDensity.datasetName) ||
        path.includes(this.datasets.profession.datasetName) ||
        path.includes(this.datasets.settlementType.datasetName) ||
        path.includes(this.datasets.travelMethod.datasetName) ||
        path.includes(this.datasets.talent.datasetName) ||
        path.includes(this.datasets.unit.datasetName);
      if (shouldReload) {
        this.reloadDatasets();
      }
    };

    this.plugin.registerEvent(this.plugin.app.vault.on("modify", modifyEvent));
  }

  private async loadCSVDataset<T>(info: DatasetInfo<T>, defaultDataString: string) {
    info.default = CSVUtils.csvParse(defaultDataString, true).map(info.converter);

    const filePath = `${this.plugin.settings.datasetsPath}/${info.datasetName}`;
    const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
    if (file === null || file instanceof TFolder) {
      // If the file is not found or is a folder, return the default data.
      info.live = info.default;
    } else {
      const content = await this.plugin.app.vault.read(file as TFile);
      const parsed = parse(content);
      parsed.shift();
      const stringArray = CSVUtils.csvArrayToStringArray(parsed);
      info.live = stringArray.map(info.converter);
    }
  }

  private async loadFMDataset<T>(info: DatasetInfo<T>, defaultDataString: string) {
    const parsedData = parseYaml(defaultDataString).data as [];
    info.default = parsedData.map(info.converter);

    const fm = await this.plugin.frontMatterManager.getFrontMatter(
      `${this.plugin.settings.datasetsPath}/${info.datasetName}`
    );
    if ("data" in fm) {
      info.live = fm.data.map(info.converter);
    }
    info.live = info.default;
  }

  private writeCSVDataset<T>(info: DatasetInfo<T>) {
    CSVUtils.writeCSVByPath(
      `${this.plugin.settings.datasetsPath}/${info.datasetName}`,
      info.default as unknown[],
      this.plugin.app.vault,
      {
        header: true,
      }
    );
  }

  private writeFMDataset<T>(info: DatasetInfo<T>) {
    this.plugin.frontMatterManager.writeFile(`${this.plugin.settings.datasetsPath}/${info.datasetName}`, {
      data: info.default,
    });
  }
}
