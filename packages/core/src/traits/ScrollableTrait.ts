/**
 * ScrollableTrait.ts
 *
 * Physics-based scrolling for UI containers.
 * Uses virtual content offset to scroll children within a viewport.
 *
 * @trait scrollable
 */

import type { TraitHandler } from './TraitTypes';
import type { HSPlusNode, Vector3 } from '../types/HoloScriptPlus';

export interface ScrollableConfig {
    axis: 'x' | 'y';
    contentHeight: number;   // Total scrollable height
    viewportHeight: number;  // Visible area height
    scrollSpeed: number;     // Multiplier for scroll velocity
    friction: number;        // Deceleration factor (0-1)
    bounceStrength: number;  // Elastic bounce at edges
}

interface ScrollState {
    offset: number;         // Current scroll offset
    velocity: number;       // Current scroll velocity
    isDragging: boolean;
    dragStartY: number;
    dragStartOffset: number;
    lastDragY: number;
    lastDragTime: number;
}

const defaultConfig: ScrollableConfig = {
    axis: 'y',
    contentHeight: 1.0,
    viewportHeight: 0.5,
    scrollSpeed: 1.0,
    friction: 0.92,
    bounceStrength: 0.3,
};

// Internal state per node
const scrollStates = new Map<string, ScrollState>();

function getState(nodeId: string): ScrollState {
    if (!scrollStates.has(nodeId)) {
        scrollStates.set(nodeId, {
            offset: 0,
            velocity: 0,
            isDragging: false,
            dragStartY: 0,
            dragStartOffset: 0,
            lastDragY: 0,
            lastDragTime: 0,
        });
    }
    return scrollStates.get(nodeId)!;
}

export const scrollableHandler: TraitHandler<ScrollableConfig> = {
    name: 'scrollable' as any,
    defaultConfig,

    onAttach(node: HSPlusNode, config: ScrollableConfig, _context: any) {
        const state = getState(node.id!);
        state.offset = 0;
        state.velocity = 0;
    },

    onDetach(node: HSPlusNode, _config: ScrollableConfig, _context: any) {
        scrollStates.delete(node.id!);
    },

    onUpdate(node: HSPlusNode, config: ScrollableConfig, context: any, delta: number) {
        const state = getState(node.id!);
        const maxOffset = Math.max(0, config.contentHeight - config.viewportHeight);

        // --- Drag Handling ---
        const vrContext = (context as any).vr;
        if (vrContext && vrContext.hands) {
            const hand = vrContext.hands.right || vrContext.hands.left;
            if (hand) {
                const handY = (hand.position as any).y || 0;

                if (hand.grip > 0.5 && !state.isDragging) {
                    // Start drag
                    state.isDragging = true;
                    state.dragStartY = handY;
                    state.dragStartOffset = state.offset;
                    state.lastDragY = handY;
                    state.lastDragTime = Date.now();
                } else if (hand.grip > 0.5 && state.isDragging) {
                    // Continue drag
                    const deltaY = handY - state.dragStartY;
                    state.offset = state.dragStartOffset - deltaY * config.scrollSpeed;

                    // Track velocity
                    const now = Date.now();
                    const dt = (now - state.lastDragTime) / 1000;
                    if (dt > 0) {
                        state.velocity = (handY - state.lastDragY) / dt;
                    }
                    state.lastDragY = handY;
                    state.lastDragTime = now;
                } else if (hand.grip <= 0.5 && state.isDragging) {
                    // Release: apply inertia
                    state.isDragging = false;
                    // velocity is already set from tracking
                }
            }
        }

        // --- Inertia ---
        if (!state.isDragging && Math.abs(state.velocity) > 0.001) {
            state.offset -= state.velocity * delta * config.scrollSpeed;
            state.velocity *= config.friction;
        }

        // --- Elastic Bounce ---
        if (state.offset < 0) {
            state.offset = state.offset * config.bounceStrength;
            state.velocity *= -config.bounceStrength;
        } else if (state.offset > maxOffset) {
            const overshoot = state.offset - maxOffset;
            state.offset = maxOffset + overshoot * config.bounceStrength;
            state.velocity *= -config.bounceStrength;
        }

        // --- Clamp ---
        state.offset = Math.max(-0.05, Math.min(state.offset, maxOffset + 0.05));

        // --- Apply offset to children ---
        if (node.children) {
            for (const child of node.children) {
                if (child.properties) {
                    const basePos = (child.properties as any)._basePosition || child.properties.position || { x: 0, y: 0, z: 0 };
                    // Save base position for first time
                    if (!(child.properties as any)._basePosition) {
                        (child.properties as any)._basePosition = { ...(child.properties.position as any || { x: 0, y: 0, z: 0 }) };
                    }

                    if (config.axis === 'y') {
                        child.properties.position = {
                            ...(basePos as any),
                            y: (basePos as any).y + state.offset,
                        };
                    } else {
                        child.properties.position = {
                            ...(basePos as any),
                            x: (basePos as any).x + state.offset,
                        };
                    }

                    // --- Simple Clipping ---
                    // Hide children that are outside viewport bounds
                    const childPos = child.properties.position as any;
                    const relativePos = config.axis === 'y' ? childPos.y : childPos.x;
                    const halfViewport = config.viewportHeight / 2;
                    (child.properties as any).visible = Math.abs(relativePos) <= halfViewport;
                }
            }
        }

        // Store scroll state on node for external access
        if (node.properties) {
            (node.properties as any).scrollOffset = state.offset;
            (node.properties as any).scrollVelocity = state.velocity;
            (node.properties as any).maxScrollOffset = maxOffset;
        }
    },
};
