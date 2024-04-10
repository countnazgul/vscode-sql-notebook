import * as vscode from 'vscode';
import { SQLNotebookConnections } from './connections';
import { connectToDatabase, deleteConnectionConfiguration } from './commands';
import { Pool } from './driver';
import { activateFormProvider } from './form';
import { SqlLspClient } from './lsp';
import { SQLSerializer } from './serializer';
import { SQLNotebookController } from './controller';
import { CellHistoryStorage } from './history';
import { HistoryStatusBarProvider } from './statusBars';

export const notebookType = 'sql-notebook';
export const storageKey = 'sqlnotebook-connections';

export const globalConnPool: { pool: Pool | null } = {
  pool: null,
};

export const globalLspClient = new SqlLspClient();

export async function activate(context: vscode.ExtensionContext) {
  const history = new CellHistoryStorage(context);
  history.validate();

  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer(
      notebookType,
      new SQLSerializer(),
    ),
  );
  const connectionsSidepanel = new SQLNotebookConnections(context);
  vscode.window.registerTreeDataProvider(
    'sqlnotebook-connections',
    connectionsSidepanel,
  );

  context.subscriptions.push(
    vscode.notebooks.registerNotebookCellStatusBarItemProvider(
      'sql-notebook',
      new HistoryStatusBarProvider(),
    ),
  );

  activateFormProvider(context);

  context.subscriptions.push(new SQLNotebookController(context));

  vscode.commands.registerCommand(
    'sqlnotebook.deleteConnectionConfiguration',
    deleteConnectionConfiguration(context, connectionsSidepanel),
  );

  vscode.commands.registerCommand(
    'sqlnotebook.showCodeHistory',
    async (context) => {
      let a = await history.getHistoryForCell(context.metadata.id);
      console.log(a);
    },
  );

  vscode.commands.registerCommand('sqlnotebook.refreshConnectionPanel', () => {
    connectionsSidepanel.refresh();
  });
  vscode.commands.registerCommand(
    'sqlnotebook.connect',
    connectToDatabase(context, connectionsSidepanel),
  );
}

export function deactivate() {}
