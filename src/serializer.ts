import { TextDecoder, TextEncoder } from 'util';
import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

interface SqlNotebookItem {
  type: 'sql' | 'markdown' | string;
  text: string;
}

interface SqlNotebook {
  [k: string]: SqlNotebookItem;
}

export class SQLSerializer implements vscode.NotebookSerializer {
  async deserializeNotebook(
    context: Uint8Array,
    _token: vscode.CancellationToken
  ): Promise<vscode.NotebookData> {
    const str = new TextDecoder().decode(context);

    let jsonNotebook: SqlNotebook = {};
    try {
      jsonNotebook = JSON.parse(str);
    } catch (e) {
      vscode.window.showErrorMessage(
        `Error while parsing the notebook! ${(e as Error).message}`
      );
      return new vscode.NotebookData([]);
    }

    const cells = Object.entries(jsonNotebook).map(([key, value]) => {
      const cellKind =
        value.type == 'markdown'
          ? vscode.NotebookCellKind.Markup
          : vscode.NotebookCellKind.Code;

      const cell = new vscode.NotebookCellData(
        cellKind,
        value.text,
        value.type
      );

      cell.metadata = {
        id: key,
      };

      return cell;
    });

    return new vscode.NotebookData(cells);
  }

  async serializeNotebook(
    data: vscode.NotebookData,
    _token: vscode.CancellationToken
  ): Promise<Uint8Array> {
    const cellKinds = {
      1: 'markdown',
      2: 'sql',
    };

    const cellsData: SqlNotebook = {};

    data.cells.map((d) => {
      if (d.metadata) {
        const id: string = !d.metadata.id ? uuidv4() : d.metadata.id;

        cellsData[id] = {
          type: cellKinds[d.kind],
          text: d.value ? d.value : '',
        };
      }
    });

    return new TextEncoder().encode(JSON.stringify(cellsData, null, 4));
  }
}

/**
 * TEMP. Just to test how it works
 */
export class StatusBarProviderTemp
  implements vscode.NotebookCellStatusBarItemProvider
{
  provideCellStatusBarItems(
    cell: vscode.NotebookCell
  ): vscode.NotebookCellStatusBarItem[] | undefined {
    const openEach = new vscode.NotebookCellStatusBarItem(
      `Test`,
      vscode.NotebookCellStatusBarAlignment.Right
    );
    openEach.command = 'sqlnotebook.blah';
    openEach.tooltip = `Temp tooltip`;

    const items: vscode.NotebookCellStatusBarItem[] = [openEach];
    return items;
  }
}
