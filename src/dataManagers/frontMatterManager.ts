import { TFile, stringifyYaml } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";
import { YAMLUtils } from "src/util/frontMatter";

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
      frontMatter = JSON.parse(JSON.stringify(data));
    });
    return frontMatter;
  }

  // Warning this is a destructive operation. It will replace the entire front matter with the new object.
  public async replaceFrontMatter(filePath: string, newFrontMatter: any) {
    const file = this.pathToFile(filePath);
    await this.plugin.app.fileManager.processFrontMatter(file, (data) => {
      Object.assign(data, newFrontMatter);
    });
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
    const file = this.plugin.app.vault.getAbstractFileByPath(fullPath);
    if (file === null) {
      Logger.error(this, `File not found: ${fullPath}`);
      return;
    }
    const fileContent = await this.plugin.app.vault.read(file as TFile);
    const replacedContent = YAMLUtils.replaceFrontMatter(fileContent, template);
    await this.plugin.app.vault.modify(file as TFile, replacedContent);
  }

  /**
   * Writes content to a file at the specified path.
   * If the file already exists, it replaces the front matter with the new content.
   * If the file does not exist, it creates a new file with the specified content as the front matter.
   * Only files with the ".md" extension are supported.
   *
   * @param fullPath - The full path of the file to write.
   * @param content - The content to write to the file.
   * @returns A Promise that resolves when the file has been written.
   */
  public async writeFile(fullPath: string, content: unknown): Promise<void> {
    if (fullPath.endsWith(".md")) {
      const file = this.plugin.app.vault.getAbstractFileByPath(fullPath);
      if (file !== null) {
        const currentFileContent = await this.plugin.app.vault.read(file as TFile);
        const newFileContent = YAMLUtils.replaceFrontMatter(currentFileContent, content);
        await this.plugin.app.vault.modify(file as TFile, newFileContent);
      } else {
        const newFileContent = "---\n" + stringifyYaml(content) + "\n---\n";
        await this.plugin.app.vault.create(fullPath, newFileContent);
      }
    }
  }

  private pathToFile(filePath: string): TFile {
    return this.plugin.app.vault.getAbstractFileByPath(filePath) as TFile;
  }
}
