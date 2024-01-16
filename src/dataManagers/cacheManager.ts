import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "src/main";

class CacheEntry<T> {
  file: TAbstractFile;
  data: T | undefined;
  unsavedChanges = false;

  constructor(file: TAbstractFile) {
    this.file = file;
    this.data = undefined;
  }
}

export class CacheManager<DataType> {
  plugin: WorldBuildingPlugin;
  fileCache: Map<string, CacheEntry<DataType>>;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.fileCache = new Map<string, CacheEntry<DataType>>();
  }

  public async load() {
    // Performs an initial load of the cache.
    // Future changes use the event listeners to keep the cache up to date.
    console.log(this.constructor.name + ": Loading all manageable files in vault.");
    const allFiles = this.plugin.app.vault.getAllLoadedFiles();
    let loadedFiles = 0;
    for (const file of allFiles) {
      if (this.isFileManageable(file)) {
        await this.onFileCreation(file);
        loadedFiles = loadedFiles + 1;
      } else {
        continue;
      }
    }
    console.log(this.constructor.name + ": Loaded " + loadedFiles + " files.");
  }

  /**
   * @param {string} fullPath  The full path of the file to read, including the file name and extension.
   */
  public async readFile(fullPath: string): Promise<DataType | undefined> {
    console.error(this.constructor.name + ": readFile not implemented.");
    return undefined;
  }

  /**
   * @param {string} fullPath  The full path of the file to write, including the file name and extension.
   * @param {DataType} data  The data to write to the file.
   */
  public async writeFile<Content>(fullPath: string, data: Content): Promise<void> {
    console.error(this.constructor.name + ": writeFile not implemented.");
    return;
  }

  /**
   * @param {string} fullPath  The full path of the file data to get, including the file name and extension.
   * @returns {DataType | undefined}  The data from the cache, or undefined if the cache does not contain the file.
   */
  public getDataByFile(fullPath: string): DataType | undefined {
    const fileEntry = this.fileCache.get(fullPath);
    if (fileEntry === undefined) {
      console.error(this.constructor.name + ": Cache did not contain this file.");
      return undefined;
    }
    const fileData = fileEntry.data;
    if (fileData === undefined) {
      console.log(this.constructor.name + ": File found but not cached, reading from disk.");
      this.readFile(fullPath).then((data) => {
        if (data === undefined) {
          console.error(this.constructor.name + ": Failed to load CSV file " + fileEntry.file.name + ".");
          return;
        }
        fileEntry.data = data;

        // Return a copy of the data so the cache doesn't get unexpectedly mangled.
        return JSON.parse(JSON.stringify(fileEntry.data));
      });
    }
    // Return a copy of the data so the cache doesn't get unexpectedly mangled.
    return JSON.parse(JSON.stringify(fileEntry.data));
  }

  /**
   * @param {string} fullPath  The full path of the file data to set, including the file name and extension.
   * @param {DataType} data  The data to write to the cache.
   */
  public setDataByFile(fullPath: string, data: DataType) {
    const fileEntry = this.fileCache.get(fullPath);
    if (fileEntry === undefined) {
      console.error(this.constructor.name + ": Cache did not contain this file. Please verify the file name.");
      return;
    }

    // Save a copy of the data to the cache.
    fileEntry.data = JSON.parse(JSON.stringify(data));
    fileEntry.unsavedChanges = true;
  }

  /**
   * @param {string} fullPath  The full path of the file data to save, including the file name and extension.
   */
  public saveDataByFile(fullPath: string) {
    const fileEntry = this.fileCache.get(fullPath);
    if (fileEntry === undefined) {
      console.error(this.constructor.name + ": Cache did not contain this file. Please verify the file name.");
      return;
    }
    if (fileEntry.data === undefined) {
      console.info(this.constructor.name + ": Data was never cached for " + fullPath + ", skipping save.");
      return;
    }
    if (fileEntry.unsavedChanges) {
      this.writeFile(fullPath, fileEntry.data);
    } else {
      console.info(this.constructor.name + ": Data was not modified for " + fullPath + ", skipping save.");
    }
  }

  public saveAllData() {
    for (const [fileName, fileEntry] of this.fileCache) {
      if (fileEntry.data === undefined) {
        console.info(this.constructor.name + ": Data was never cached for " + fileName + ", skipping save.");
        continue;
      }
      if (fileEntry.unsavedChanges) {
        this.writeFile(fileEntry.file.path, fileEntry.data);
        fileEntry.unsavedChanges = false;
      } else {
        console.info(this.constructor.name + ": Data was not modified for " + fileName + ", skipping save.");
      }
    }
  }

  // Event handlers
  public async onFileCreation(file: TAbstractFile) {
    const fileEntry = new CacheEntry<DataType>(file);

    if (this.plugin.settings.cacheFilesOnLoad) {
      const data = await this.readFile(file.path);
      if (data === undefined) {
        console.error(this.constructor.name + ": Failed to load file " + file.name + ".");
        return;
      }
      fileEntry.data = data;
    }

    this.fileCache.set(file.path, fileEntry);
  }

  public onFileDeletion(file: TAbstractFile) {
    const result = this.fileCache.delete(file.path);
    if (!result) {
      console.error(this.constructor.name + ": Cache did not contain this file.");
      return;
    }
  }

  public onFileRename(file: TAbstractFile, oldPath: string) {
    const fileEntry = this.fileCache.get(oldPath);
    if (fileEntry === undefined) {
      console.error(this.constructor.name + ": Cache did not contain this file.");
      return;
    }
    this.fileCache.delete(oldPath);
    this.fileCache.set(file.path, fileEntry);
  }

  public isFileManageable(file: TAbstractFile): boolean {
    console.error(this.constructor.name + ": isFileManageable not implemented.");
    return false;
  }
}
