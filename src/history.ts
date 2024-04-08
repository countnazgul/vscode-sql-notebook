import * as vscode from 'vscode';

interface CellHistory {
  timestamp: string;
  text: string;
}

interface HistoryFile {
  [k: string]: CellHistory[];
}

export class CellHistoryStorage {
  private histFile: vscode.Uri;

  constructor(public readonly context: vscode.ExtensionContext) {
    this.context = context;
    this.histFile = vscode.Uri.file(
      this.context.globalStorageUri.fsPath + '/history.json',
    );
  }

  /**
   * ran on extension activation. Perform checks if the history file exists and if it does NOT
   * then it creates it with default content {}
   */
  async validate(): Promise<void> {
    try {
      await vscode.workspace.fs.stat(this.histFile);
    } catch (e) {
      if ((e as Error).name.startsWith('EntryNotFound')) {
        await vscode.workspace.fs.writeFile(this.histFile, Buffer.from('{}'));
        return;
      }

      vscode.window.showErrorMessage(
        `Unable to read history file content! ${(e as Error).message}`,
      );
    }
  }

  /**
   * Gets the full content of the history file
   */
  private async getHistFileContent(): Promise<HistoryFile> {
    try {
      let histFileContent = (
        await vscode.workspace.fs.readFile(this.histFile)
      ).toString();

      return JSON.parse(histFileContent);
    } catch (e) {
      vscode.window.showErrorMessage(
        `Unable to read history file content! ${(e as Error).message}`,
      );
      return {};
    }
  }

  private async writeHistFileContent(content: string) {
    await vscode.workspace.fs.writeFile(this.histFile, Buffer.from(content));
  }

  /**
   * Returns the history entries for a given cellId
   */
  async getHistoryForCell(cellId: string) {
    const histFile = await this.getHistFileContent();

    return histFile[cellId];
  }

  /**
   * Deletes the history entries for a given cellId
   */
  async deleteAllHistoryForCell(cellId: string) {
    const histFile = await this.getHistFileContent();

    delete histFile[cellId];

    await this.writeHistFileContent(JSON.stringify(histFile));
  }

  /**
   * Saves cell history entry for a given cellId.
   * Makes sure that max of 10 history entries per cell are kept
   * Do not store history entry if the exact same text/entry already exists.
   */
  async addHistoryEntryForCell(cellId: string, text: string) {
    const histFile = await this.getHistFileContent();

    if (!histFile[cellId]) {
      histFile[cellId] = [
        {
          timestamp: new Date().toISOString(),
          text,
        },
      ];

      await this.writeHistFileContent(JSON.stringify(histFile));
      return;
    }

    // check if exactly same entry already exists
    // if it does then do not store new record
    const isHistEntryExists = histFile[cellId].filter((h) => h.text == text);
    if (isHistEntryExists.length > 0) return;

    // removed the earliest history entry if the max
    // number of entries is reached (10)
    if (histFile[cellId].length >= 10) histFile[cellId].shift();

    histFile[cellId].push({
      timestamp: new Date().toISOString(),
      text,
    });

    await this.writeHistFileContent(JSON.stringify(histFile));
    return;
  }
}
