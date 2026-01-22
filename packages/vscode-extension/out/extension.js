"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = require("path");
const fs = require("fs");
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    // Try multiple possible server locations
    const possiblePaths = [
        // Bundled with extension
        path.join(context.extensionPath, 'server', 'lsp', 'server.js'),
        // In workspace (monorepo development)
        path.join(context.extensionPath, '..', 'cli', 'dist', 'lsp', 'server.js'),
        // Installed globally via npm
        path.join(context.extensionPath, 'node_modules', '@holoscript', 'cli', 'dist', 'lsp', 'server.js'),
    ];
    let serverModule;
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
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.ipc,
        }
    };
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'holoscript' }],
        synchronize: {
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.holoscriptrc')
        }
    };
    client = new node_1.LanguageClient('holoscriptLSP', 'HoloScript Language Server', serverOptions, clientOptions);
    // Start the client
    client.start().catch((err) => {
        console.error('HoloScript: Failed to start language server:', err);
    });
}
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
//# sourceMappingURL=extension.js.map