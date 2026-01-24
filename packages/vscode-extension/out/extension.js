"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = require("path");
const fs = require("fs");
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
const previewPanel_1 = require("./previewPanel");
let client;
function activate(context) {
    // Register the preview command
    context.subscriptions.push(vscode_1.commands.registerCommand('holoscript.openPreview', () => {
        const editor = vscode_1.window.activeTextEditor;
        if (editor && isHoloScriptFile(editor.document)) {
            previewPanel_1.HoloScriptPreviewPanel.createOrShow(context.extensionUri, editor.document);
        }
        else {
            vscode_1.window.showWarningMessage('Open a HoloScript file (.holo or .hsplus) to preview.');
        }
    }));
    // Register command to open preview to the side
    context.subscriptions.push(vscode_1.commands.registerCommand('holoscript.openPreviewToSide', () => {
        const editor = vscode_1.window.activeTextEditor;
        if (editor && isHoloScriptFile(editor.document)) {
            previewPanel_1.HoloScriptPreviewPanel.createOrShow(context.extensionUri, editor.document);
        }
        else {
            vscode_1.window.showWarningMessage('Open a HoloScript file (.holo or .hsplus) to preview.');
        }
    }));
    // Auto-update preview when switching documents
    context.subscriptions.push(vscode_1.window.onDidChangeActiveTextEditor(editor => {
        if (editor && isHoloScriptFile(editor.document) && previewPanel_1.HoloScriptPreviewPanel.currentPanel) {
            previewPanel_1.HoloScriptPreviewPanel.currentPanel.updateContent(editor.document);
        }
    }));
    // Register webview panel serializer for restore on restart
    if (vscode_1.window.registerWebviewPanelSerializer) {
        context.subscriptions.push(vscode_1.window.registerWebviewPanelSerializer(previewPanel_1.HoloScriptPreviewPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel, _state) {
                previewPanel_1.HoloScriptPreviewPanel.revive(webviewPanel, context.extensionUri);
            }
        }));
    }
    // Try multiple possible server locations
    const possiblePaths = [
        // Bundled with extension
        path.join(context.extensionPath, 'server', 'lsp', 'server.js'),
        // In workspace (monorepo development)
        path.join(context.extensionPath, '..', 'cli', 'dist', 'lsp', 'server.js'),
        // Installed globally via npm
        path.join(context.extensionPath, 'node_modules', '@holoscript', 'cli', 'dist', 'lsp', 'server.js'),
        // From lsp package directly
        path.join(context.extensionPath, '..', 'lsp', 'dist', 'server.js'),
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
        documentSelector: [
            { scheme: 'file', language: 'holoscript' },
            { scheme: 'file', language: 'holoscriptplus' },
        ],
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
function isHoloScriptFile(document) {
    const fileName = document.fileName.toLowerCase();
    return fileName.endsWith('.holo') || fileName.endsWith('.hsplus');
}
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
//# sourceMappingURL=extension.js.map