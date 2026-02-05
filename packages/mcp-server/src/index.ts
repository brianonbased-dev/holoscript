/**
 * @holoscript/mcp-server
 * 
 * Model Context Protocol server for HoloScript language tooling.
 * Enables AI agents (Grok, Claude, Copilot, etc.) to parse, validate,
 * and generate HoloScript code in real-time.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import from @holoscript/core
import {
  HoloScriptParser,
  HoloScriptPlusParser,
  HoloCompositionParser,
  HoloScriptValidator,
  parseHoloScriptPlus,
  parseHolo,
  parseHoloStrict,
  formatRichError,
  formatRichErrors,
  VR_TRAITS,
} from '@holoscript/core';

import { tools } from './tools';
import { handleTool } from './handlers';

// Create MCP server
const server = new Server(
  {
    name: 'holoscript-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const result = await handleTool(name, args || {});
    return {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('HoloScript MCP Server running on stdio');
}

main().catch(console.error);

// Also export for programmatic use
export { server, tools, handleTool };
export * from './tools';
export * from './handlers';
export * from './generators';
export * from './renderer';
