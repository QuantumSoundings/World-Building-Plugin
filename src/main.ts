import { App, FileSystemAdapter, Modal, Plugin, PluginSettingTab, Setting} from 'obsidian';
import { CSVManager } from './dataManagers/csvManager';
import { SettlementAPI } from './api/settlementApi';
import { PopulationAPI } from './api/populationApi';
import { UnitConversionAPI } from './api/unitConversionApi';
import { YAMLManager } from './dataManagers/yamlManager';
import { PSDManager } from './dataManagers/psdManager';

// Remember to rename these classes and interfaces!

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
		console.log('Loaded plugin: WorldBuilding');
	}

	onunload() {
		console.log('Unloading plugin: WorldBuilding');
		this.csvManager.unload();
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
