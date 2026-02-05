/**
 * MCP Tool Definitions for HoloScript
 * 
 * Provides AI agents with tools to parse, validate, generate, and render HoloScript.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * All MCP tools for HoloScript
 */
export const tools: Tool[] = [
  // === PARSING ===
  {
    name: 'parse_hs',
    description: 'Parse HoloScript (.hs) or HoloScript Plus (.hsplus) code into an AST. Use for understanding structure of existing code.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The HoloScript or HoloScript Plus code to parse',
        },
        format: {
          type: 'string',
          enum: ['hs', 'hsplus'],
          description: 'The format of the input code. Defaults to hsplus (auto-detects)',
        },
        includeSourceMap: {
          type: 'boolean',
          description: 'Include source map for debugging',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'parse_holo',
    description: 'Parse a .holo composition file into an AST. Use for scene-centric declarative files with compositions.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The .holo composition code to parse',
        },
        strict: {
          type: 'boolean',
          description: 'Use strict parsing mode (fails on warnings)',
        },
      },
      required: ['code'],
    },
  },
  
  // === VALIDATION ===
  {
    name: 'validate_holoscript',
    description: 'Validate HoloScript code for syntax errors, unknown traits, and best practices. Returns AI-friendly error messages with suggestions.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The HoloScript code to validate (any format: .hs, .hsplus, .holo)',
        },
        format: {
          type: 'string',
          enum: ['hs', 'hsplus', 'holo', 'auto'],
          description: 'The format of the input. Defaults to auto-detect.',
        },
        includeWarnings: {
          type: 'boolean',
          description: 'Include warnings in addition to errors',
        },
        includeSuggestions: {
          type: 'boolean',
          description: 'Include fix suggestions for each error',
        },
      },
      required: ['code'],
    },
  },
  
  // === TRAITS ===
  {
    name: 'list_traits',
    description: 'List all 49 VR traits available in HoloScript with their categories.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['interaction', 'physics', 'visual', 'networking', 'behavior', 'spatial', 'audio', 'state', 'all'],
          description: 'Filter by category. Defaults to all.',
        },
      },
    },
  },
  {
    name: 'explain_trait',
    description: 'Get detailed documentation for a specific VR trait including parameters and example usage.',
    inputSchema: {
      type: 'object',
      properties: {
        trait: {
          type: 'string',
          description: 'The trait name (with or without @, e.g., "grabbable" or "@grabbable")',
        },
      },
      required: ['trait'],
    },
  },
  {
    name: 'suggest_traits',
    description: 'Suggest appropriate VR traits for an object based on its description.',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Description of the object (e.g., "a sword that can be picked up and thrown")',
        },
        context: {
          type: 'string',
          description: 'Additional context about the scene or use case',
        },
      },
      required: ['description'],
    },
  },
  
  // === CODE GENERATION ===
  {
    name: 'generate_object',
    description: 'Generate a HoloScript object definition from a natural language description.',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Natural language description of the object to create',
        },
        format: {
          type: 'string',
          enum: ['hs', 'hsplus', 'holo'],
          description: 'Output format. Defaults to hsplus.',
        },
        includeDocs: {
          type: 'boolean',
          description: 'Include inline documentation comments',
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'generate_scene',
    description: 'Generate a complete .holo scene composition from a natural language description.',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Natural language description of the scene to create',
        },
        style: {
          type: 'string',
          enum: ['minimal', 'detailed', 'production'],
          description: 'Level of detail in the generated code',
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific features to include (e.g., ["physics", "audio", "networking"])',
        },
      },
      required: ['description'],
    },
  },
  
  // === DOCUMENTATION ===
  {
    name: 'get_syntax_reference',
    description: 'Get syntax documentation for a specific HoloScript construct.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: ['orb', 'object', 'template', 'composition', 'environment', 'spatial_group', 'logic', 'animation', 'physics', 'events', 'networking', 'traits'],
          description: 'The syntax topic to get documentation for',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'get_examples',
    description: 'Get example HoloScript code for common patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          enum: [
            'interactive-object',
            'multiplayer-sync',
            'teleportation',
            'portal',
            'inventory',
            'animation',
            'physics-puzzle',
            'ui-panel',
            'audio-ambient',
            'day-night-cycle',
            'procedural-generation',
            'hand-tracking',
          ],
          description: 'The pattern to get an example for',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'explain_code',
    description: 'Get a plain English explanation of what HoloScript code does.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The HoloScript code to explain',
        },
        detail: {
          type: 'string',
          enum: ['brief', 'detailed', 'tutorial'],
          description: 'Level of detail in the explanation',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'analyze_code',
    description: 'Analyze HoloScript code for complexity, performance, and best practices.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The HoloScript code to analyze',
        },
      },
      required: ['code'],
    },
  },
  
  // === RENDERING (NEW - for X/Grok integration) ===
  {
    name: 'render_preview',
    description: 'Generate a static preview image or animated GIF of a HoloScript scene. Returns a URL that can be shared on X.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The HoloScript code to render',
        },
        format: {
          type: 'string',
          enum: ['png', 'gif', 'mp4', 'webp'],
          description: 'Output format. Defaults to png.',
        },
        resolution: {
          type: 'array',
          items: { type: 'number' },
          description: 'Resolution [width, height]. Defaults to [800, 600].',
        },
        camera: {
          type: 'object',
          properties: {
            position: {
              type: 'array',
              items: { type: 'number' },
            },
            target: {
              type: 'array',
              items: { type: 'number' },
            },
          },
          description: 'Camera position and target',
        },
        duration: {
          type: 'number',
          description: 'Animation duration in milliseconds (for gif/mp4)',
        },
        quality: {
          type: 'string',
          enum: ['draft', 'preview', 'production'],
          description: 'Render quality level',
        },
      },
      required: ['code'],
    },
  },
  
  // === SHARING (NEW - for X/Grok integration) ===
  {
    name: 'create_share_link',
    description: 'Create a shareable playground link for HoloScript code. Perfect for X posts.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The HoloScript code to share',
        },
        title: {
          type: 'string',
          description: 'Title for the shared scene',
        },
        description: {
          type: 'string',
          description: 'Description for social previews',
        },
        platform: {
          type: 'string',
          enum: ['x', 'generic', 'codesandbox', 'stackblitz'],
          description: 'Optimize for specific platform. Defaults to x.',
        },
      },
      required: ['code'],
    },
  },
  
  // === TRANSFORMATION ===
  {
    name: 'convert_format',
    description: 'Convert HoloScript code between formats (.hs, .hsplus, .holo).',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The code to convert',
        },
        from: {
          type: 'string',
          enum: ['hs', 'hsplus', 'holo'],
          description: 'Source format',
        },
        to: {
          type: 'string',
          enum: ['hs', 'hsplus', 'holo'],
          description: 'Target format',
        },
      },
      required: ['code', 'to'],
    },
  },
];

// Tool name type for type safety
export type ToolName = typeof tools[number]['name'];

// Helper to get tool by name
export function getTool(name: string): Tool | undefined {
  return tools.find(t => t.name === name);
}
