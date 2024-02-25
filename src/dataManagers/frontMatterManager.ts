import { TFile } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { YAMLUtils } from "src/util/frontMatter";
import { stringify } from "yaml";

// This class will be responsible for managing the front matter of the markdown files
// It will not maintain a cache. Everything will be done through the processFrontMatter method.
export class FrontMatterManager {
  plugin: WorldBuildingPlugin;
  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }

  public async getFrontMatter(filePath: string): Promise<any> {
    const file = this.pathToFile(filePath);
    let frontMatter;
    await this.plugin.app.fileManager.processFrontMatter(file, (data) => {
      frontMatter = data;
    });
    return frontMatter;
  }

  public async addUpdateFrontMatterProperty(filePath: string, key: string, value: any) {
    const file = this.pathToFile(filePath);
    await this.plugin.app.fileManager.processFrontMatter(file, (data) => {
      data[key] = value;
    });
  }

  public async removeFrontMatterProperty(filePath: string, key: string) {
    const file = this.pathToFile(filePath);
    await this.plugin.app.fileManager.processFrontMatter(file, (data) => {
      delete data[key];
    });
  }

  public async writeFrontMatterTemplate(fullPath: string, template: string) {
    const fileContent = await this.plugin.adapter.read(fullPath);
    const replacedContent = YAMLUtils.replaceFrontMatter(fileContent, template);
    await this.plugin.adapter.write(fullPath, replacedContent);
  }

  public async writeFile(fullPath: string, content: unknown): Promise<void> {
    if (fullPath.endsWith(".md")) {
      const file = this.plugin.app.vault.getAbstractFileByPath(fullPath);
      let newFileContent = "";
      if (file !== null) {
        const currentFileContent = await this.plugin.adapter.read(fullPath);
        newFileContent = YAMLUtils.replaceFrontMatter(currentFileContent, content);
      } else {
        newFileContent = "---\n" + stringify(content) + "\n---\n";
      }
      await this.plugin.adapter.write(fullPath, newFileContent);
    }
  }

  private pathToFile(filePath: string): TFile {
    return this.plugin.app.vault.getAbstractFileByPath(filePath) as TFile;
  }
}
