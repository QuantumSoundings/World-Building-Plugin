/* eslint-disable no-debugger */
import Handsontable from "handsontable";
import { HyperFormula } from "hyperformula";
import { ButtonComponent, Notice, Setting, ToggleComponent } from "obsidian";
import WorldBuildingPlugin from "src/main";

class TableState {
  // Settings
  headersActive: boolean;
  autoSave: boolean;
  // Operation state
  currentlyLoading: boolean;
}

export class TableElement extends HTMLElement {
  plugin: WorldBuildingPlugin;

  // Table Settings Objects
  autoSaveToggle: ToggleComponent;
  headerToggle: ToggleComponent;
  saveButton: ButtonComponent;

  // HTML Elements
  fileOptionsElement: HTMLElement;
  loadingBarElement: HTMLElement;

  // Members
  handsonTable: Handsontable;
  handsonTableBaseSettings: Handsontable.GridSettings;
  handsonTableExport: Handsontable.plugins.ExportFile;
  handsonTableFilters: Handsontable.plugins.Filters;
  // Setting to string array for files with headers
  // Setting to true for files without headers, enables filtering
  headerData: string[] | true;
  rowData: string[][];
  tableState: TableState;

  // Callback functions to fix 'this' weirdness
  onHandsonTableChange = (changes: Handsontable.CellChange[], source: Handsontable.ChangeSource): void => {
    if (source === "loadData" || this.tableState.currentlyLoading) {
      return; //don't save this change
    }
    if (this.tableState.autoSave) {
      this.requestAutoSave();
    }
  };
  requestAutoSave = (): void => {
    if (this.tableState.autoSave) {
      this.requestSave();
    }
  };

  // constructor
  constructor(parentElement: HTMLElement, fileSource: string, plugin: WorldBuildingPlugin) {
    //Calling the parent constructor
    super();
    this.plugin = plugin;
    this.tableState = new TableState();
    this.tableState.headersActive = true;
    this.tableState.autoSave = false;
    this.tableState.currentlyLoading = false;

    // Setup html elements
    this.loadingBarElement = parentElement.createDiv();
    this.loadingBarElement.addClass("progress-bar");
    this.loadingBarElement.innerHTML =
      '<div class="progress-bar-message u-center-text">Loading CSV...</div><div class="progress-bar-indicator"><div class="progress-bar-line"></div><div class="progress-bar-subline" style="display: none;"></div><div class="progress-bar-subline mod-increase"></div><div class="progress-bar-subline mod-decrease"></div></div>';

    this.fileOptionsElement = parentElement.createDiv();
    this.fileOptionsElement.classList.add("csv-controls");

    const tableContainer = parentElement.createDiv();
    tableContainer.classList.add("csv-table-wrapper");
    const handsonTableContainer = tableContainer.createDiv();

    this.configureHandsonTable(handsonTableContainer);
    this.configureSettingComponents();
  }

  private configureHandsonTable(parentElement: HTMLElement) {
    // Create and configure the table
    this.handsonTableBaseSettings = {
      // Data is bound using these two properties.
      data: this.rowData,
      colHeaders: this.headerData,
      // Other configuration options
      afterChange: this.onHandsonTableChange,
      afterColumnSort: this.requestAutoSave,
      afterColumnMove: this.requestAutoSave,
      afterRowMove: this.requestAutoSave,
      afterCreateCol: this.requestAutoSave,
      afterCreateRow: this.requestAutoSave,
      afterRemoveCol: this.requestAutoSave,
      afterRemoveRow: this.requestAutoSave,
      height: "auto",
      width: "auto",
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
        engine: HyperFormula,
      },
      licenseKey: "non-commercial-and-evaluation",
    };
    this.handsonTable = new Handsontable(parentElement, this.handsonTableBaseSettings);
  }

  private configureSettingComponents() {
    //Creating a toggle to set the header
    new Setting(this.fileOptionsElement).setName("File Includes Headers").addToggle((toggle) => {
      this.headerToggle = toggle;
      this.headerToggle.setValue(true);
      this.headerToggle.onChange((toggleState) => {
        if (toggleState) {
          // Headers are currently disabled,
          // and we need to enable them
          if (this.headerData === true) {
            const shiftedData = this.rowData.shift();
            if (shiftedData !== undefined) {
              this.headerData = shiftedData;
            } else {
              console.warn("File had no rows.");
            }
          } else if (this.headerData instanceof Array) {
            console.warn("Headers already enabled.");
          }
        } else {
          // Headers are currently enabled,
          // and we need to disable them
          if (this.headerData instanceof Array) {
            this.rowData.unshift(this.headerData);
            this.headerData = true;
          } else if (this.headerData === true) {
            console.warn("Headers already disabled.");
          }
        }
        this.rebindDataToTable();
        this.tableState.headersActive = toggleState;
      });
    });

    //Creating a toggle to allow the toggle of the auto Save
    new Setting(this.fileOptionsElement).setName("Auto Save").addToggle((toggle: ToggleComponent) => {
      this.autoSaveToggle = toggle;
      this.autoSaveToggle.setValue(this.tableState.autoSave);
      this.autoSaveToggle.onChange((value) => {
        this.tableState.autoSave = value;
      });
    });

    //Creating a Save button
    new Setting(this.fileOptionsElement).setName("Save").addButton((button: ButtonComponent) => {
      this.saveButton = button;
      this.saveButton.onClick((e: MouseEvent) => {
        this.requestSave();
      });
    });
  }

  private loadDataFromSource(fileSource: string) {
    const fileData = this.plugin.csvManager.getCSVData(fileSource);
    if (fileData === undefined) {
      console.error("File data was undefined.");
      return;
    }

    // Toggle says we have headers, split them out from the row data.
    if (this.headerToggle.getValue()) {
      const parsedHeader = fileData.shift();
      if (parsedHeader !== undefined) {
        this.headerData = parsedHeader;
      } else {
        console.warn("File had no rows.");
        this.headerData = true;
      }
    } else {
      this.headerData = true;
    }
    this.rowData = parsedData;
  }

  // Overrides on the class tree

  // Member Functions
  public setTableData(data: string | string[][]) {
    const activeFile = this.plugin.app.workspace.getActiveFile();
    if (activeFile === null) {
      console.error("No active file.");
      return;
    }
    const activeFilePath = activeFile.name;
    this.handsonTable.rootElement.id = activeFilePath.split(".")[0];
    this.handsonTableBaseSettings.colHeaders = true;

    // strip Byte Order Mark if necessary (damn you, Excel)
    if (data.charCodeAt(0) === 0xfeff) data = data.slice(1);

    const parsedData = this.plugin.csvManager.parseCSVString(data);
    // Toggle says we have headers, split them out from the row data.
    if (this.headerToggle.getValue()) {
      const parsedHeader = parsedData.shift();
      if (parsedHeader !== undefined) {
        this.headerData = parsedHeader;
      } else {
        console.warn("File had no rows.");
        this.headerData = true;
      }
    } else {
      this.headerData = true;
    }
    this.rowData = parsedData;
  }

  public rebindDataToTable() {
    this.handsonTableBaseSettings.data = this.rowData;
    this.handsonTableBaseSettings.colHeaders = this.headerData;
    this.handsonTable.updateSettings(this.handsonTableBaseSettings);
  }
}
