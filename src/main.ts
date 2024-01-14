import { App, FileSystemAdapter, Modal, Plugin, PluginSettingTab, Setting} from 'obsidian';
import { CSVManager } from './dataManagers/csvManager';
import { SettlementAPI } from './api/settlementApi';
import { PopulationAPI } from './api/populationApi';
import { UnitConversionAPI } from './api/unitConversionApi';
import { YAMLManager } from './dataManagers/yamlManager';
import { PSDManager } from './dataManagers/psdManager';
import { CSVView } from './views/csvView';

interface WorldBuildingPluginSettings {
	dataDirectory: string;
	settlementData: string;
	populationDensityData: string;
	unitConversionData: string;
}

const DEFAULT_SETTINGS: WorldBuildingPluginSettings = {
	dataDirectory: '',
	settlementData: '',
	populationDensityData: '',
	unitConversionData: ''
}

export default class WorldBuildingPlugin extends Plugin {
	settings: WorldBuildingPluginSettings;
	adapter: FileSystemAdapter;
	// Data Managers
	csvManager: CSVManager;
	yamlManager: YAMLManager;
	psdManager: PSDManager;
	// APIs provided to other plugins
	private settlementAPI: SettlementAPI;
	private populationAPI: PopulationAPI;
	private unitConversionAPI: UnitConversionAPI;

	async onload() {
		// Initialize all the members of the plugin
		this.adapter = this.app.vault.adapter as FileSystemAdapter;
		this.csvManager = new CSVManager(this);
		this.yamlManager = new YAMLManager(this);
		this.psdManager = new PSDManager(this);
		this.settlementAPI = new SettlementAPI(this);
		this.populationAPI = new PopulationAPI(this);
		this.unitConversionAPI = new UnitConversionAPI(this);

		// Do any loading operations that need awaits.
		await this.loadSettings();
		await this.csvManager.load();
		await this.yamlManager.load();
		await this.psdManager.load();

		this.refreshAPIs();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WorldBuildingSettingTab(this.app, this));

		this.addCommand({
			id: 'save-default-data-to-data-directory',
			name: 'Save Default Data to Data Directory',
			checkCallback: (checking: boolean) => {
				// COnly show this command if the data directory is set.
				if (this.settings.dataDirectory !== '') {
					// Checking is true when the command is being registered, and false when it is being called.
					if (!checking) {
						this.writeDefaultDataToDataDirectory();
					}
					return true;
				}
				else {
					return false;
				}
			}
		});

		// Setup the csv viewer
		this.registerView('csv', (leaf) => {
			return new CSVView(leaf, this);
		});
		this.registerExtensions(["csv"], "csv");

		// Finished!
		console.log('Loaded plugin: WorldBuilding');
	}

	onunload() {
		console.log('Unloading plugin: WorldBuilding');
		this.csvManager.unload();
		this.yamlManager.unload();
		this.psdManager.unload();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	refreshAPIs() {
		this.settlementAPI.reloadData();
		this.populationAPI.reloadData();
		this.unitConversionAPI.reloadData();
	}

	getSettlementAPI(): SettlementAPI {
		return this.settlementAPI;
	}

	getPopulationAPI(): PopulationAPI {
		return this.populationAPI;
	}

	getUnitConversionAPI(): UnitConversionAPI {
		return this.unitConversionAPI;
	}

	writeDefaultDataToDataDirectory() {
		this.csvManager.writeFile(this.settings.dataDirectory, 'default_settlement_types', 'csv', this.settlementAPI.data);
		this.csvManager.writeFile(this.settings.dataDirectory, 'default_population_density', 'csv', this.populationAPI.data);
		this.yamlManager.writeFile(this.settings.dataDirectory, 'default_unit_conversion', 'md', this.unitConversionAPI.data);
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class WorldBuildingModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class WorldBuildingSettingTab extends PluginSettingTab {
	plugin: WorldBuildingPlugin;

	constructor(app: App, plugin: WorldBuildingPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Data Directory')
			.setDesc('The directory where CSV/YAML/MD(with frontmatter) data is stored.\n These files are loaded and cached on start.')
			.addText(text => text
				.setPlaceholder('Enter the directory')
				.setValue(this.plugin.settings.dataDirectory)
				.onChange(async (value) => {
					this.plugin.settings.dataDirectory = value;
					console.log('In the onChange for our settings function');
					await this.plugin.saveSettings();
					await this.plugin.csvManager.reload();
				})
			);

		new Setting(containerEl)
			.setName('Settlement Data File')
			.setDesc('This file overrides the internal settlement data.')
			.addText(text => text
				.setPlaceholder('Enter the file name')
				.setValue(this.plugin.settings.settlementData)
				.onChange(async (value) => {
					this.plugin.settings.settlementData = value;
					console.log('In the onChange for our settings function');
					await this.plugin.saveSettings();
					this.plugin.refreshAPIs();
				}));

		new Setting(containerEl)
			.setName('Population Density Data File')
			.setDesc('This file overrides the internal population density data.')
			.addText(text => text
				.setPlaceholder('Enter the file name')
				.setValue(this.plugin.settings.populationDensityData)
				.onChange(async (value) => {
					this.plugin.settings.populationDensityData = value;
					console.log('In the onChange for our settings function');
					await this.plugin.saveSettings();
					this.plugin.refreshAPIs();
				}));

		new Setting(containerEl)
			.setName('Unit Conversion Data File')
			.setDesc('This file overrides the internal unit conversion data.')
			.addText(text => text
				.setPlaceholder('Enter the file name')
				.setValue(this.plugin.settings.unitConversionData)
				.onChange(async (value) => {
					this.plugin.settings.unitConversionData = value;
					console.log('In the onChange for our settings function');
					await this.plugin.saveSettings();
					this.plugin.refreshAPIs();
				}));
	}
}
