import { Modal, Notice, Setting, TextAreaComponent } from "obsidian";
import WorldBuildingPlugin from "src/main";

export class GenerateNamesModal extends Modal {
  plugin: WorldBuildingPlugin;

  nameType: string;
  selectedOrigin: string;
  selectedGender: string;
  numberToGenerate: number;

  constructor(plugin: WorldBuildingPlugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h1", { text: "Generate Names" });

    new Setting(contentEl).setName("Name Type").addDropdown((dropdown) => {
      dropdown.addOptions({ "First Name": "First Name", "Last Name": "Last Name" });
      dropdown.onChange((value) => {
        this.nameType = value;
      });
      this.nameType = dropdown.getValue();
    });

    new Setting(contentEl).setName("Origin").addDropdown((dropdown) => {
      dropdown.addOptions(this.plugin.nameGenerator.getOriginRecords());
      dropdown.onChange((value) => {
        this.selectedOrigin = value;
      });
      this.selectedOrigin = dropdown.getValue();
    });

    new Setting(contentEl).setName("Gender").addDropdown((dropdown) => {
      dropdown.addOptions(this.plugin.nameGenerator.getGenderRecords());
      dropdown.onChange((value) => {
        this.selectedGender = value;
      });
      this.selectedGender = dropdown.getValue();
    });

    new Setting(contentEl).setName("Number to Generate").addText((text) => {
      text.setValue("5");
      text.onChange((value) => {
        this.numberToGenerate = parseInt(value);
      });
      this.numberToGenerate = parseInt(text.getValue());
    });

    let outputTextArea: TextAreaComponent;

    new Setting(contentEl).setName("Generated Names").addTextArea((text) => {
      text.setValue("");
      outputTextArea = text;
    });

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Generate")
        .setCta()
        .onClick(() => {
          if (!this.selectedOrigin) {
            new Notice("Please select an origin.");
            return;
          } else if (!this.selectedGender) {
            new Notice("Please select a gender.");
          } else if (!this.numberToGenerate) {
            new Notice("Please enter a number to generate.");
          }

          const names = this.plugin.nameGenerator.generateNames(
            this.nameType,
            this.selectedOrigin,
            this.selectedGender,
            this.numberToGenerate
          );

          outputTextArea.setValue(names.join("\n"));
        })
    );
  }

  onClose() {
    super.onClose();
  }
}
