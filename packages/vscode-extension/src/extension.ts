import * as path from 'path';
import * as fs from 'fs';
import { workspace, ExtensionContext } from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext) {
  // Try multiple possible server locations
  const possiblePaths = [
    // Bundled with extension
    path.join(context.extensionPath, 'server', 'lsp', 'server.js'),
    // In workspace (monorepo development)
    path.join(context.extensionPath, '..', 'cli', 'dist', 'lsp', 'server.js'),
    // Installed globally via npm
    path.join(context.extensionPath, 'node_modules', '@holoscript', 'cli', 'dist', 'lsp', 'server.js'),
  ];

  let serverModule: string | undefined;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      serverModule = p;
      break;
    }
  }

  // If no server found, just provide syntax highlighting (no LSP features)
  if (!serverModule) {
    console.log('HoloScript: Language server not found. Running in syntax-only mode.');
    return;
  }

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
    }
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'holoscript' }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/.holoscriptrc')
    }
  };

  client = new LanguageClient(
    'holoscriptLSP',
    'HoloScript Language Server',
    serverOptions,
    clientOptions
  );

  // Start the client
  client.start().catch((err) => {
    console.error('HoloScript: Failed to start language server:', err);
  });
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
