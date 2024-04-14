/* eslint-disable no-debugger */
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import Handsontable from "handsontable";
import { HyperFormula } from "hyperformula";
import { HoverParent, HoverPopover, MarkdownRenderChild, Setting, TFile, ToggleComponent } from "obsidian";
import { CSV_HOVER_SOURCE } from "src/constants";
import WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";
import { FileUtils } from "src/util/file";

class TableState {
  // Settings
  headersActive: boolean;
  // Operation state
  currentlyLoading: boolean;
}

export class TableComponent extends MarkdownRenderChild implements HoverParent {
  plugin: WorldBuildingPlugin;
  hoverPopover: HoverPopover | null;

  // Table Settings Objects
  headerToggle: ToggleComponent;

  // HTML Elements
  fileOptionsElement: HTMLElement;
  loadingBarElement: HTMLElement;
  tableContainerElement: HTMLElement;
  fileNotFoundElement: HTMLElement;

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

  fileSourcePath: string;
  unloaded: boolean;

  // constructor
  constructor(parentElement: HTMLElement, plugin: WorldBuildingPlugin) {
    //Calling the parent constructor
    super(parentElement);
    this.plugin = plugin;
    this.tableState = new TableState();
    this.tableState.headersActive = true;
    this.tableState.currentlyLoading = false;
    this.unloaded = true;

    // Setup html elements
    this.fileNotFoundElement = parentElement.createDiv();
    this.fileNotFoundElement.setText("CSV file not found. Please double check path.");
    this.fileNotFoundElement.hide();

    this.loadingBarElement = parentElement.createDiv();
    this.loadingBarElement.addClass("progress-bar");
    this.loadingBarElement.innerHTML =
      '<div class="progress-bar-message u-center-text">Loading CSV...</div><div class="progress-bar-indicator"><div class="progress-bar-line"></div><div class="progress-bar-subline" style="display: none;"></div><div class="progress-bar-subline mod-increase"></div><div class="progress-bar-subline mod-decrease"></div></div>';
    this.loadingBarElement.show();

    this.fileOptionsElement = parentElement.createDiv();
    this.fileOptionsElement.classList.add("csv-controls");

    this.tableContainerElement = parentElement.createDiv();
    this.tableContainerElement.classList.add("csv-table-wrapper");
    const handsonTableContainer = this.tableContainerElement.createDiv();
    this.hoverPopover = new HoverPopover(this, handsonTableContainer);

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
      height: 700,
      width: "auto",
      rowHeaders: true,
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
      className: "custom-table-component",
      licenseKey: "non-commercial-and-evaluation",
    };

    this.handsonTable = new Handsontable(parentElement, this.handsonTableBaseSettings);

    this.handsonTable.addHook(
      "afterOnCellMouseOver",
      (event: MouseEvent, coords: Handsontable.CellCoords, TD: HTMLTableCellElement) => {
        const cellData = this.handsonTable.getSourceDataAtCell(coords.row, coords.col) as string;
        // Check it here to prevent sending excess events
        if (cellData.startsWith("[[") && cellData.endsWith("]]")) {
          this.plugin.app.workspace.trigger("hover-link", {
            event: event,
            source: CSV_HOVER_SOURCE,
            hoverParent: this,
            targetEl: TD,
            linktext: FileUtils.parseBracketLink(cellData),
          });
        }
      }
    );
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
              Logger.warn(this, "File had no rows.");
            }
          } else if (this.headerData instanceof Array) {
            Logger.warn(this, "Headers already enabled.");
          }
        } else {
          // Headers are currently enabled,
          // and we need to disable them
          if (this.headerData instanceof Array) {
            this.rowData.unshift(this.headerData);
            this.headerData = true;
          } else if (this.headerData === true) {
            Logger.warn(this, "Headers already disabled.");
          }
        }
        this.rebindDataToTable();
        this.tableState.headersActive = toggleState;
      });
    });
  }

  // These three functions control data load/save for embedded views.
  public setSourcePath(filePath: string) {
    this.fileSourcePath = filePath;
  }

  // Public functions to control the state of the table.
  override onload(): void {
    super.onload();
    const file = this.plugin.app.vault.getAbstractFileByPath(this.fileSourcePath);
    if (file === null) {
      Logger.error(this, "File not found.");
      this.fileOptionsElement.hide();
      this.loadingBarElement.hide();
      this.tableContainerElement.hide();
      this.fileNotFoundElement.show();
      return;
    }
    this.plugin.app.vault.read(file as TFile).then((data) => {
      this.setViewData(data);
    });
  }

  // Call this when you are about to destroy the component.
  override onunload(): void {
    const file = this.plugin.app.vault.getAbstractFileByPath(this.fileSourcePath);
    if (file === null) {
      return super.onunload();
    }
    this.plugin.app.vault
      .process(file as TFile, () => {
        return this.getViewData();
      })
      .then(() => {
        super.onunload();
      });
  }

  public getViewData(): string {
    const dataCopy = JSON.parse(JSON.stringify(this.rowData));
    if (this.tableState.headersActive) {
      dataCopy.unshift(this.headerData);
    }

    return stringify(dataCopy);
  }

  public setViewData(data: string): void {
    this.loadingBarElement.show();
    const fileData = parse(data);
    if (this.headerToggle.getValue()) {
      const parsedHeader = fileData.shift();
      if (parsedHeader !== undefined) {
        this.headerData = parsedHeader;
      } else {
        Logger.warn(this, "File had no rows.");
        this.headerData = true;
        this.tableState.headersActive = false;
      }
    } else {
      this.headerData = true;
      this.tableState.headersActive = false;
    }
    this.rowData = fileData;

    // In case the file is empty give us a few rows and columns to work with.
    if (this.rowData.length === 0) {
      if (this.headerData instanceof Array) {
        const row = [];
        for (let i = 0; i < this.headerData.length; i++) {
          row.push("");
        }
        this.rowData = [row, row, row, row];
      } else {
        this.rowData = [
          ["", "", "", ""],
          ["", "", "", ""],
          ["", "", "", ""],
          ["", "", "", ""],
        ];
      }
    }

    this.rebindDataToTable();
    this.loadingBarElement.hide();
    this.unloaded = false;
  }

  private rebindDataToTable() {
    this.handsonTableBaseSettings.data = this.rowData;
    this.handsonTableBaseSettings.colHeaders = this.headerData;
    this.handsonTable.updateSettings(this.handsonTableBaseSettings);
  }
}
