/**
 * CompletionProvider.ts
 *
 * Provides auto-completion for HoloScript+ editing.
 * Suggests traits, directives, node types, properties, and presets.
 */

export interface CompletionItem {
    label: string;
    kind: 'trait' | 'directive' | 'property' | 'type' | 'keyword' | 'preset' | 'snippet';
    detail?: string;
    insertText?: string;
    documentation?: string;
}

// Known trait names
const TRAIT_COMPLETIONS: CompletionItem[] = [
    { label: 'grabbable', kind: 'trait', detail: 'Make node grabbable in VR', insertText: '@grabbable' },
    { label: 'audio', kind: 'trait', detail: 'Spatial audio source', insertText: '@audio(sound: "")' },
    { label: 'particles', kind: 'trait', detail: 'Attach particle system', insertText: '@particles(preset: "dust")' },
    { label: 'animation', kind: 'trait', detail: 'Keyframe animation', insertText: '@animation(clip: "")' },
    { label: 'state', kind: 'trait', detail: 'Finite state machine', insertText: '@state(initial: "idle")' },
    { label: 'sync', kind: 'trait', detail: 'Network synchronization', insertText: '@sync(rate: 20)' },
    { label: 'theme', kind: 'trait', detail: 'Apply theme styles', insertText: '@theme(classes: [])' },
    { label: 'events', kind: 'trait', detail: 'Event bus wiring', insertText: '@events(listen: {})' },
    { label: 'scrollable', kind: 'trait', detail: 'Physics-based scrolling', insertText: '@scrollable' },
    { label: 'keyboard', kind: 'trait', detail: 'VR keyboard input', insertText: '@keyboard' },
];

// Known directive names
const DIRECTIVE_COMPLETIONS: CompletionItem[] = [
    { label: 'version', kind: 'directive', detail: 'Scene version', insertText: '@version("1.0")' },
    { label: 'author', kind: 'directive', detail: 'Author metadata', insertText: '@author("")' },
    { label: 'if', kind: 'directive', detail: 'Conditional rendering', insertText: '@if(condition)' },
    { label: 'each', kind: 'directive', detail: 'List iteration', insertText: '@each(items as item)' },
    { label: 'on', kind: 'directive', detail: 'Event handler', insertText: '@on("event")' },
    { label: 'emit', kind: 'directive', detail: 'Emit event', insertText: '@emit("event")' },
    { label: 'networked', kind: 'directive', detail: 'Network replication', insertText: '@networked(mode: "owner")' },
    { label: 'slot', kind: 'directive', detail: 'Content slot', insertText: '@slot("default")' },
];

// Node types
const TYPE_COMPLETIONS: CompletionItem[] = [
    { label: 'box', kind: 'type', detail: '3D box primitive' },
    { label: 'sphere', kind: 'type', detail: '3D sphere primitive' },
    { label: 'cylinder', kind: 'type', detail: '3D cylinder primitive' },
    { label: 'plane', kind: 'type', detail: '3D plane primitive' },
    { label: 'panel', kind: 'type', detail: 'UI panel container' },
    { label: 'button', kind: 'type', detail: 'Interactive button' },
    { label: 'text', kind: 'type', detail: 'Text element' },
    { label: 'group', kind: 'type', detail: 'Container node' },
    { label: 'light', kind: 'type', detail: 'Light source' },
    { label: 'camera', kind: 'type', detail: 'Camera viewpoint' },
];

// Property names
const PROPERTY_COMPLETIONS: CompletionItem[] = [
    { label: 'position', kind: 'property', detail: 'Vec3', insertText: 'position: [0, 0, 0]' },
    { label: 'rotation', kind: 'property', detail: 'Vec3', insertText: 'rotation: [0, 0, 0]' },
    { label: 'scale', kind: 'property', detail: 'Vec3', insertText: 'scale: [1, 1, 1]' },
    { label: 'color', kind: 'property', detail: 'Color string', insertText: 'color: "#FFFFFF"' },
    { label: 'opacity', kind: 'property', detail: 'Number 0-1', insertText: 'opacity: 1' },
    { label: 'visible', kind: 'property', detail: 'Boolean', insertText: 'visible: true' },
];

export class CompletionProvider {
    private customTraits: CompletionItem[] = [];

    /**
     * Register a custom trait completion.
     */
    registerTrait(item: CompletionItem): void {
        this.customTraits.push(item);
    }

    /**
     * Get completions at a cursor context.
     */
    getCompletions(context: { prefix: string; triggerChar?: string }): CompletionItem[] {
        const prefix = context.prefix.toLowerCase();

        // @ trigger → show traits and directives
        if (context.triggerChar === '@' || prefix.startsWith('@')) {
            const search = prefix.replace('@', '');
            return [...TRAIT_COMPLETIONS, ...DIRECTIVE_COMPLETIONS, ...this.customTraits]
                .filter(c => c.label.toLowerCase().startsWith(search));
        }

        // No prefix → show node types
        if (!prefix) {
            return TYPE_COMPLETIONS;
        }

        // Property-like context
        if (prefix.includes(':') || prefix.includes('.')) {
            return PROPERTY_COMPLETIONS.filter(c =>
                c.label.toLowerCase().includes(prefix.split(/[:.]/g).pop() || ''),
            );
        }

        // General search
        const all = [...TYPE_COMPLETIONS, ...PROPERTY_COMPLETIONS, ...TRAIT_COMPLETIONS, ...DIRECTIVE_COMPLETIONS, ...this.customTraits];
        return all.filter(c => c.label.toLowerCase().includes(prefix));
    }

    /**
     * Get total available completions.
     */
    get totalCompletions(): number {
        return TRAIT_COMPLETIONS.length + DIRECTIVE_COMPLETIONS.length +
               TYPE_COMPLETIONS.length + PROPERTY_COMPLETIONS.length + this.customTraits.length;
    }
}
