# Introduction to HoloScript

HoloScript is the **spatial programming language** for VR, AR, and 3D applications. It removes the abstraction barrier between humans and computation—instead of writing text that a machine interprets, you **manipulate computation directly** as spatial objects.

## Why HoloScript?

### For Humans

- **No syntax errors** - Visual/declarative approach eliminates brackets and semicolons
- **Universal input** - Voice, gesture, gaze, or traditional keyboard
- **See the data flow** - Watch computation happen in 3D space

### For AI

- **Visual understanding** - AI "sees" program structure
- **Native manipulation** - AI can place and connect objects naturally
- **Any output target** - Generate code for any platform

### For Computing

- **One source → 9 platforms** - Web, VR, AR, mobile, desktop, Unity, Unreal, VRChat
- **50,000 → 500 lines** - Declarative syntax eliminates boilerplate
- **Built for collaboration** - Human and AI work in the same space

## File Formats

HoloScript uses three file formats:

| Extension | Purpose            | Best For                         |
| --------- | ------------------ | -------------------------------- |
| `.hs`     | Classic HoloScript | Simple prototypes, learning      |
| `.hsplus` | HoloScript Plus    | VR traits, networking, physics   |
| `.holo`   | Composition        | AI-generated scenes, full worlds |

## Quick Start

Install the VS Code extension:

```bash
ext install holoscript.holoscript-vscode
```

Create your first scene:

```holo
composition "Hello World" {
  environment {
    skybox: "gradient"
    ambient_light: 0.5
  }

  object "Cube" {
    @collidable
    position: [0, 1, -3]
    color: "#00ffff"
  }
}
```

## Next Steps

- [Quick Start Guide](./quick-start) - Build your first HoloScript app
- [File Formats](./file-formats) - Deep dive into .hs, .hsplus, and .holo
- [VR Traits](./traits) - All 55 built-in traits explained
