import * as vscode from 'vscode';

interface McpRegistrationPayload {
  id: string;
  name: string;
  command: string;
  args: string[];
  workspace: string;
  status: 'active' | 'inactive' | 'error';
  visibility?: 'public' | 'private';
  tools?: string[];
}

export class McpOrchestratorClient {
  private readonly output = vscode.window.createOutputChannel('HoloScript MCP');
  private heartbeatTimer: NodeJS.Timeout | null = null;

  start(context: vscode.ExtensionContext): void {
    const config = this.getConfig();

    if (!config.enabled) {
      this.log('MCP integration disabled by settings.');
      return;
    }

    if (!config.apiKey || !config.url) {
      this.log('Missing MCP API configuration. Set holoscript.mcpOrchestratorUrl and holoscript.mcpApiKey.');
      return;
    }

    this.register(config).catch(err => this.log(`Register failed: ${err}`));

    this.startHeartbeat(config);

    context.subscriptions.push({ dispose: () => this.stopHeartbeat() });

    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('holoscript.mcp')) {
        this.stopHeartbeat();
        const next = this.getConfig();
        if (next.enabled && next.apiKey && next.url) {
          this.register(next).catch(err => this.log(`Register failed: ${err}`));
          this.startHeartbeat(next);
        }
      }
    });
  }

  private getConfig() {
    const cfg = vscode.workspace.getConfiguration('holoscript.mcp');
    const url = cfg.get<string>('orchestratorUrl') || '';
    const apiKey = cfg.get<string>('apiKey') || '';
    const enabled = cfg.get<boolean>('enabled', true);
    const heartbeatSeconds = cfg.get<number>('heartbeatSeconds', 20);
    const visibility = cfg.get<'public' | 'private'>('visibility', 'public');
    const workspace = cfg.get<string>('workspaceId', 'holoscript');
    return { url, apiKey, enabled, heartbeatSeconds, visibility, workspace };
  }

  private buildRegistrationPayload(config: ReturnType<McpOrchestratorClient['getConfig']>): McpRegistrationPayload {
    const machineId = vscode.env.machineId?.slice(0, 8) || 'local';
    const id = `holoscript-vscode-${machineId}`;

    return {
      id,
      name: 'HoloScript VS Code Extension',
      command: 'vscode',
      args: [],
      workspace: config.workspace,
      status: 'active',
      visibility: config.visibility,
      tools: [
        'holoscript.agent.createFile',
        'holoscript.agent.generateObject',
        'holoscript.agent.analyzeScene',
        'holoscript.agent.insertCode',
        'holoscript.agent.openPreview',
        'holoscript.agent.addTrait',
        'holoscript.agent.listTraits',
        'holoscript.agent.validate',
        'holoscript.agent.status',
        'holoscript.openPreview',
        'holoscript.openPreviewToSide',
        'holoscript.validate'
      ]
    };
  }

  private async register(config: ReturnType<McpOrchestratorClient['getConfig']>): Promise<void> {
    const payload = this.buildRegistrationPayload(config);

    await fetch(`${config.url}/servers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mcp-api-key': config.apiKey
      },
      body: JSON.stringify(payload)
    });

    this.log('Registered with MCP orchestrator.');
  }

  private startHeartbeat(config: ReturnType<McpOrchestratorClient['getConfig']>): void {
    const payload = this.buildRegistrationPayload(config);
    const intervalMs = Math.max(10, config.heartbeatSeconds) * 1000;

    this.heartbeatTimer = setInterval(async () => {
      try {
        await fetch(`${config.url}/servers/${payload.id}/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-mcp-api-key': config.apiKey
          },
          body: JSON.stringify({ status: 'active', tools: payload.tools })
        });
      } catch (err) {
        this.log(`Heartbeat failed: ${err}`);
      }
    }, intervalMs);

    this.log(`Heartbeat started (${config.heartbeatSeconds}s).`);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      this.log('Heartbeat stopped.');
    }
  }

  private log(message: string): void {
    this.output.appendLine(`[MCP] ${message}`);
  }

  async getStatus(): Promise<{ ok: boolean; message: string }>{
    const config = this.getConfig();

    if (!config.enabled) {
      return { ok: false, message: 'Integration disabled (holoscript.mcp.enabled=false)' };
    }

    if (!config.url) {
      return { ok: false, message: 'Missing orchestrator URL (holoscript.mcp.orchestratorUrl)' };
    }

    if (!config.apiKey) {
      return { ok: false, message: 'Missing MCP API key (holoscript.mcp.apiKey)' };
    }

    try {
      const health = await fetch(`${config.url}/health`);
      if (!health.ok) {
        return { ok: false, message: `Health check failed (${health.status})` };
      }

      const servers = await fetch(`${config.url}/servers`, {
        headers: { 'x-mcp-api-key': config.apiKey }
      });

      if (!servers.ok) {
        return { ok: false, message: `Auth failed (${servers.status})` };
      }

      return { ok: true, message: `Connected to ${config.url}` };
    } catch (error: any) {
      return { ok: false, message: `Connection failed: ${error?.message || error}` };
    }
  }
}
