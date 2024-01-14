/* eslint-disable no-debugger */
import Handsontable from "handsontable";
import { HyperFormula } from "hyperformula";
import { ButtonComponent, Notice, Setting, TextFileView, ToggleComponent, WorkspaceLeaf } from "obsidian";
import WorldBuildingPlugin from "src/main";

class CSVViewState {
	// Settings
	headersActive: boolean;
	autoSave: boolean;
	// Operation state
	currentlyLoading: boolean;
}

export class CSVView extends TextFileView {
  plugin: WorldBuildingPlugin;
  // File Settings Objects
	autoSaveToggle: ToggleComponent;
  headerToggle: ToggleComponent;
	saveButton: ButtonComponent;

	// HTML Elements
	fileOptionsElement: HTMLElement;
	loadingBarElement: HTMLElement;

  // Members
	handsonTable: Handsontable;
	handsonTableHyperFormula: HyperFormula;
	handsonTableBaseSettings: Handsontable.GridSettings;
	handsonTableExport: Handsontable.plugins.ExportFile;
	handsonTableFilters: Handsontable.plugins.Filters;
	headerData: string[] | false;
	rowData: string[][];
	viewState: CSVViewState;


	// Callback functions to fix 'this' weirdness
	onHandsonTableChange = (changes: Handsontable.CellChange[], source: Handsontable.ChangeSource): void => {
		if (source === "loadData" || this.viewState.currentlyLoading) {
			return; //don't save this change
		}
		if(this.viewState.autoSave) {
			this.requestAutoSave();
		}
	};
	requestAutoSave = (): void => {
		if(this.viewState.autoSave) {
			this.requestSave();
		}
	}

	// constructor
	constructor(leaf: WorkspaceLeaf, plugin: WorldBuildingPlugin) {
		//Calling the parent constructor
		super(leaf);
		this.plugin = plugin;
		this.viewState = new CSVViewState();
		this.viewState.headersActive = true;
		this.viewState.autoSave = false;
		this.viewState.currentlyLoading = false;

		// Setup html elements
		this.loadingBarElement = document.createElement("div");
		this.loadingBarElement.addClass("progress-bar");
		this.loadingBarElement.innerHTML = "<div class=\"progress-bar-message u-center-text\">Loading CSV...</div><div class=\"progress-bar-indicator\"><div class=\"progress-bar-line\"></div><div class=\"progress-bar-subline\" style=\"display: none;\"></div><div class=\"progress-bar-subline mod-increase\"></div><div class=\"progress-bar-subline mod-decrease\"></div></div>";
		this.contentEl.appendChild(this.loadingBarElement);

		this.fileOptionsElement = document.createElement("div");
		this.fileOptionsElement.classList.add("csv-controls");
		this.contentEl.appendChild(this.fileOptionsElement);

		const tableContainer = document.createElement("div");
		tableContainer.classList.add("csv-table-wrapper");
		this.contentEl.appendChild(tableContainer);

		const handsonTableContainer = document.createElement("div");
		tableContainer.appendChild(handsonTableContainer);

		// Create and configure the table
		this.handsonTableHyperFormula = HyperFormula.buildEmpty({
			licenseKey: "internal-use-in-handsontable",
		});

		this.handsonTableBaseSettings = {
			// Data is bound using these two properties.
			data: this.rowData,
			colHeaders: this.headerData,
			// Other configuration options
			afterChange: this.onHandsonTableChange,
			afterColumnSort: this.requestAutoSave,
			afterColumnMove: this.requestAutoSave,
			afterRowMove:   this.requestAutoSave,
			afterCreateCol: this.requestAutoSave,
			afterCreateRow: this.requestAutoSave,
			afterRemoveCol: this.requestAutoSave,
			afterRemoveRow: this.requestAutoSave,
			height: 'auto',
			width: 'auto',
			rowHeaders: true,
			maxRows: 10000,
			dropdownMenu: true,
			contextMenu: true,
			filters: true,
			manualRowMove: true,
			manualColumnMove: true,
			autoWrapCol: true,
			columnSorting: true,
			formulas: {
				engine: this.handsonTableHyperFormula
			},
			licenseKey: "non-commercial-and-evaluation",
		};
		this.handsonTable = new Handsontable(handsonTableContainer, this.handsonTableBaseSettings);

		//Creating a toggle to set the header
		new Setting(this.fileOptionsElement)
			.setName("File Includes Headers")
			.addToggle(toggle => {
				this.headerToggle = toggle;
				this.headerToggle.setValue(true);
				this.headerToggle.onChange((toggleState) => {
					if (toggleState) {
						// Headers are currently disabled,
						// and we need to enable them
						if (this.headerData === false) {
							const shiftedData = this.rowData.shift();
							if (shiftedData !== undefined) {
								this.headerData = shiftedData;
							}
							else {
								console.warn("File had no rows.");
							}
						}
						else if (this.headerData instanceof Array) {
							console.warn("Headers already enabled.");
						}
					}
					else {
						// Headers are currently enabled,
						// and we need to disable them
						if (this.headerData instanceof Array) {
							this.rowData.unshift(this.headerData);
							this.headerData = false;
						}
						else if (this.headerData === false) {
							console.warn("Headers already disabled.");
						}
					}
					this.rebindDataToTable();
					this.viewState.headersActive = toggleState;
				});
		});

		//Creating a toggle to allow the toggle of the auto Save
		new Setting(this.fileOptionsElement)
			.setName("Auto Save")
			.addToggle((toggle: ToggleComponent) => {
				this.autoSaveToggle = toggle;
				this.autoSaveToggle.setValue(this.viewState.autoSave);
				this.autoSaveToggle.onChange((value) => {
					this.viewState.autoSave = value;
				});
			});

		//Creating a Save button
		new Setting(this.fileOptionsElement)
		.setName("Save")
		.addButton((button: ButtonComponent) => {
			this.saveButton = button;
			this.saveButton.onClick((e: MouseEvent) => {
				this.requestSave();
			});
		});
	}

	// Overrides on the class tree
	override clear(): void {
	}

	override getViewData(): string {
		if(this.handsonTable && !this.handsonTable.isDestroyed) {
			// Make a copy of the row data
			const viewData = JSON.parse(JSON.stringify(this.rowData));
			// Headers are defined
			if (this.headerData instanceof Array) {
				viewData.unshift(this.headerData);
			}

			return this.plugin.csvManager.stringifyCSVArray(viewData);
		} else {
			return this.data;
		}
	}
	override setViewData(data: string, clear: boolean): void {
		if (clear) {
			// We are loading data, stop the table from updating
			this.viewState.currentlyLoading = true;
		}
		this.data = data;
		this.loadingBarElement.show();
		this.loadViewData(data);
		this.rebindDataToTable();
		this.loadingBarElement.hide();
		this.viewState.currentlyLoading = false;
	}

	override async save(clear?: boolean): Promise<void> {
		const SaveNoticeTimeout = 1000;
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (activeFile === null) {
			console.error("No active file.");
			return;
		}
		const activeFileName = activeFile.name;
		try {
			await super.save(clear);
			new Notice(`"${activeFileName}" was saved.`,SaveNoticeTimeout);
		} catch (e) {
			new Notice(`"${activeFileName}" couldn't be saved.`,SaveNoticeTimeout);
			throw e;
		}
	}

	// Member Functions
	public loadViewData(data: string) {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (activeFile === null) {
			console.error("No active file.");
			return;
		}
		const activeFilePath = activeFile.name;
		this.handsonTable.rootElement.id = activeFilePath.split(".")[0];
		this.handsonTableBaseSettings.colHeaders = true;

		// strip Byte Order Mark if necessary (damn you, Excel)
		if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);

		const parsedData = this.plugin.csvManager.parseCSVString(data);
		// Toggle says we have headers, split them out from the row data.
		if (this.headerToggle.getValue()) {
			const parsedHeader = parsedData.shift();
			if (parsedHeader !== undefined) {
				this.headerData = parsedHeader;
			}
			else {
				console.warn("File had no rows.");
				this.headerData = false;
			}
		}
		else {
			this.headerData = false;
		}
		this.rowData = parsedData;
	}

	public rebindDataToTable() {
		this.handsonTableBaseSettings.data = this.rowData;
		this.handsonTableBaseSettings.colHeaders = this.headerData;
		this.handsonTable.updateSettings(this.handsonTableBaseSettings);
	}

	// Some random get methods
	public getDisplayText() {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			return activeFile.basename;
		}
		else {
			return "csv (no file)";
		}
	}
	public canAcceptExtension(extension: string) {
		return extension == "csv";
	}
	public getViewType() {
		return "csv";
	}
	public getIcon() {
		return "document-csv";
	}
}

