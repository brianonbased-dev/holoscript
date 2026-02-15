
/**
 * SceneSerializer.ts
 *
 * Serializes HoloScript+ scene graphs to JSON-compatible format.
 * Handles Map/Set conversion, circular reference protection,
 * and trait config extraction.
 */

import type { HSPlusNode } from '../types/HoloScriptPlus';
import { World, Entity } from '../ecs/World';

// =============================================================================
// TYPES
// =============================================================================

export interface SerializedScene {
    version: number;
    timestamp: string;
    name: string;
    root: SerializedNode;
    metadata?: Record<string, any>;
}

export interface SerializedNode {
    id: string;
    type: string;
    properties: Record<string, any>;
    traits: Record<string, any>;     // Map<string,T> → Object
    children: SerializedNode[];
}

// =============================================================================
// SERIALIZER
// =============================================================================

export class SceneSerializer {
    private world?: World;
    private visitedIds: Set<string> = new Set();

    constructor(world?: World) {
        this.world = world;
    }

    /**
     * Serialize the current World state.
     */
    serialize(sceneName: string = 'untitled', metadata?: Record<string, any>): string | null {
        if (!this.world) return null;
        
        const entities = this.world.getAllEntities();
        
        // Find primitives (entities with NO parent)
        const childEntities = new Set<Entity>();
        
        entities.forEach(e => {
             const t = this.world!.getComponent<any>(e, 'Transform');
             if (t && t.parent !== undefined) {
                 childEntities.add(e);
             }
        });

        // Roots are entities that are NOT children
        const roots = entities.filter(e => !childEntities.has(e));
        
        // Exclude internal/system entities if tagged 'NoSerialize' or similar?
        // Or if ID starts with 'sys_'?
        // For now, serialize everything visible.
        // Or specifically exclude 'Gizmo' tag?
        // Let's filter out 'NoSelect' tag usually implies editor gizmos.
        const validRoots = roots.filter(e => !this.world!.hasTag(e, 'NoSelect') && !this.world!.hasTag(e, 'Gizmo'));
        
        const serializedRoots = validRoots.map(e => this.serializeEntity(e));

        const scene: SerializedScene = {
            version: 1,
            timestamp: new Date().toISOString(),
            name: sceneName,
            root: {
                id: 'scene_root',
                type: 'root', // Virtual root
                properties: {},
                traits: {},
                children: serializedRoots
            },
            metadata
        };
        
        return JSON.stringify(scene, null, 2);
    }

    private serializeEntity(entity: Entity): SerializedNode {
        const id = `e_${entity}`; 
        
        const properties: Record<string, any> = {};
        const traits: Record<string, any> = {};

        const compTypes = this.world!.getComponentTypes(entity);
        
        compTypes.forEach(type => {
            const data = this.world!.getComponent<any>(entity, type);
            if (!data) return;
            
            if (type === 'Transform') {
                // Robust extraction: Handle { position } or { x, y, z }
                const pos = data.position || { x: data.x || 0, y: data.y || 0, z: data.z || 0 };
                console.log(`[Serializer] Extracting Transform: data=`, data, `pos=`, pos);
                const rot = data.rotation || { x: data.rx || 0, y: data.ry || 0, z: data.rz || 0, w: data.rw || 1 }; // or simplified
                const scl = data.scale || { x: data.sx || 1, y: data.sy || 1, z: data.sz || 1 };
                
                properties.position = pos;
                properties.rotation = rot;
                properties.scale = scl;
            } else if (type === 'Text') {
                properties.text = data.content; 
            } else if (type === 'Render') {
                traits['render'] = data;
            } else if (type === 'Collider') {
                traits['collider'] = data;
            } else if (type === 'Pressable') {
                traits['pressable'] = data;
            } else {
                // Generic fallback
                const traitName = type.charAt(0).toLowerCase() + type.slice(1);
                traits[traitName] = data;
            }
        });

        const children: SerializedNode[] = [];
        const all = this.world!.getAllEntities();
        all.forEach(other => {
             const t = this.world!.getComponent<any>(other, 'Transform');
             // Strict check: t.parent === entity
             // Note: internal representation of parent matches entity ID or ref?
             // Since we use Entity (number) as ID, strict equality works if t.parent stored Entity.
             if (t && t.parent === entity) {
                 // Recursively serialize children
                 // but ensure we don't serialize gizmos
                 if (!this.world!.hasTag(other, 'NoSelect')) {
                     children.push(this.serializeEntity(other));
                 }
             }
        });

        return {
            id,
            type: 'entity',
            properties: this.sanitizeProperties(properties),
            traits: this.sanitizeValue(traits),
            children
        };
    }

    /**
     * Legacy/Utility: Serialize a HSPlusNode tree
     */
    serializeNode(node: HSPlusNode): SerializedNode {
        const id = node.id || 'unknown';

        if (this.visitedIds.has(id)) {
            return { id, type: 'ref', properties: {}, traits: {}, children: [] };
        }
        this.visitedIds.add(id);

        const traits: Record<string, any> = {};
        if (node.traits instanceof Map) {
            for (const [key, value] of node.traits) {
                traits[key] = this.sanitizeValue(value);
            }
        } else if (node.traits && typeof node.traits === 'object') {
            for (const [key, value] of Object.entries(node.traits)) {
                traits[key] = this.sanitizeValue(value);
            }
        }

        const properties = this.sanitizeProperties(node.properties || {});
        const children = (node.children || []).map(child => this.serializeNode(child));

        return { id, type: node.type || 'entity', properties, traits, children };
    }
    
    // Helper to match existing signature if needed, or update tests
    toJSON(root: HSPlusNode): string {
         return JSON.stringify(this.serializeNode(root), null, 2);
    }

    private sanitizeProperties(props: any): Record<string, any> {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(props)) {
            if (key.startsWith('_')) continue;
            if (key === '__holo_id') continue;
            result[key] = this.sanitizeValue(value);
        }
        return result;
    }

    private sanitizeValue(value: any): any {
        if (value === null || value === undefined) return value;
        if (typeof value === 'function') return undefined;

        if (value instanceof Map) {
            const obj: Record<string, any> = {};
            for (const [k, v] of value) {
                obj[String(k)] = this.sanitizeValue(v);
            }
            return obj;
        }

        if (value instanceof Set) {
            return Array.from(value).map(v => this.sanitizeValue(v));
        }

        if (Array.isArray(value)) {
            return value.map(v => this.sanitizeValue(v));
        }

        if (typeof value === 'object') {
            const result: Record<string, any> = {};
            for (const [k, v] of Object.entries(value)) {
                if (k.startsWith('_')) continue;
                const sanitized = this.sanitizeValue(v);
                if (sanitized !== undefined) {
                    result[k] = sanitized;
                }
            }
            return result;
        }

        return value;
    }
}
