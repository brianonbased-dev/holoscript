# AI Generation Examples

System prompts, templates, and examples for AI agents (Grok, Claude, Copilot) to generate HoloScript code.

## Directory Structure

```
ai-generation/
├── prompts/
│   ├── scene-builder.md     # Scene composition prompts
│   ├── object-generator.md  # Object creation prompts
│   └── trait-advisor.md     # Trait recommendation prompts
├── integrations/
│   ├── xai-grok.ts         # xAI/Grok integration
│   ├── ollama-local.ts     # Local Ollama testing
│   └── mcp-client.ts       # MCP client example
└── examples/
    ├── enchanted-forest.holo
    ├── sci-fi-station.holo
    └── multiplayer-arena.holo
```

## Quick Start for AI Agents

### Using MCP Tools

```typescript
// 1. Suggest traits for an object
const traits = await mcp.call('suggest_traits', {
  description: 'a sword that can be picked up and thrown'
});
// → ["@grabbable", "@throwable", "@collidable"]

// 2. Generate object code
const object = await mcp.call('generate_object', {
  description: 'a glowing blue crystal that floats',
  format: 'hsplus'
});
// → orb Crystal @glowing @animated { ... }

// 3. Generate complete scene
const scene = await mcp.call('generate_scene', {
  description: 'an enchanted forest with glowing mushrooms and a fairy',
  style: 'detailed'
});

// 4. Validate the code
const validation = await mcp.call('validate_holoscript', {
  code: scene.code,
  includeSuggestions: true
});

// 5. Create share link for X
const share = await mcp.call('create_share_link', {
  code: scene.code,
  title: 'Enchanted Forest',
  platform: 'x'
});
```

### Using Python Bindings

```python
from holoscript import HoloScript

hs = HoloScript()

# Generate from natural language
scene = hs.generate("a floating castle in the clouds")

# Validate
if hs.validate(scene.code).valid:
    # Share on X
    share = hs.share(scene.code, platform="x")
    print(f"Tweet: {share.tweet_text}")
    print(f"Playground: {share.playground_url}")
```

## System Prompts

See individual prompt files for detailed system prompts optimized for:
- Scene composition from vague descriptions
- Object generation with appropriate traits
- Trait selection based on behavior requirements
- Error correction and code improvement

## Best Practices

1. **Always validate** generated code before sharing
2. **Use trait suggestions** for interactive objects
3. **Include physics** for realistic object behavior
4. **Add audio** for immersive experiences
5. **Consider networking** for multiplayer scenes
