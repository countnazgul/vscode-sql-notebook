import * as vscode from 'vscode';
import { Command } from 'vscode-languageclient';

export class HistoryStatusBarProvider
  implements vscode.NotebookCellStatusBarItemProvider
{
  provideCellStatusBarItems(
    cell: vscode.NotebookCell,
  ): vscode.NotebookCellStatusBarItem[] | undefined {
    const history = new vscode.NotebookCellStatusBarItem(
      `History`,
      vscode.NotebookCellStatusBarAlignment.Right,
    );
    history.command = 'sqlnotebook.showCodeHistory';
    history.tooltip = `Code execution history`;

    const items: vscode.NotebookCellStatusBarItem[] = [history];
    return items;
  }
}
