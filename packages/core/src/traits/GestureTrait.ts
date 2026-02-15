/**
 * GestureTrait.ts
 *
 * Recognizes VR hand gestures by analyzing hand joint data over time.
 * Emits semantic gesture events that other traits/systems can react to.
 *
 * Supported Gestures:
 * - swipe_left / swipe_right / swipe_up / swipe_down
 * - pinch (thumb + index close)
 * - palm_open (all fingers extended)
 * - fist (all fingers curled)
 * - point (index extended, others curled)
 *
 * @trait gesture
 */

import type { TraitHandler } from './TraitTypes';
import type { HSPlusNode, Vector3, VRHand } from '../types/HoloScriptPlus';

export interface GestureConfig {
    hand: 'left' | 'right' | 'both';
    swipeThreshold: number;       // Min velocity for swipe detection (m/s)
    swipeMinDistance: number;      // Min distance for swipe (meters)
    pinchThreshold: number;       // Pinch strength threshold (0-1)
    gestureTimeout: number;       // Cooldown between gestures (ms)
    emitEvents: boolean;          // Whether to emit runtime events
}

export type GestureType =
    | 'swipe_left' | 'swipe_right' | 'swipe_up' | 'swipe_down'
    | 'pinch_start' | 'pinch_end'
    | 'palm_open' | 'fist' | 'point';

interface HandHistory {
    positions: Array<{ pos: Vector3; time: number }>;
    wasPinching: boolean;
    lastGestureTime: number;
    lastGesture: GestureType | null;
}

const handHistories = new Map<string, HandHistory>();
const MAX_HISTORY = 10;

function getHistory(key: string): HandHistory {
    if (!handHistories.has(key)) {
        handHistories.set(key, {
            positions: [],
            wasPinching: false,
            lastGestureTime: 0,
            lastGesture: null,
        });
    }
    return handHistories.get(key)!;
}

function vec3Dist(a: Vector3, b: Vector3): number {
    const dx = (a as any).x - (b as any).x;
    const dy = (a as any).y - (b as any).y;
    const dz = (a as any).z - (b as any).z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

const defaultGestureConfig: GestureConfig = {
    hand: 'right',
    swipeThreshold: 0.8,
    swipeMinDistance: 0.1,
    pinchThreshold: 0.7,
    gestureTimeout: 500,
    emitEvents: true,
};

export const gestureHandler: TraitHandler<GestureConfig> = {
    name: 'gesture' as any,
    defaultConfig: defaultGestureConfig,

    onAttach(node: HSPlusNode, _config: GestureConfig, _context: any) {
        // Initialize
    },

    onDetach(node: HSPlusNode, _config: GestureConfig, _context: any) {
        handHistories.delete(`${node.id}_left`);
        handHistories.delete(`${node.id}_right`);
    },

    onUpdate(node: HSPlusNode, config: GestureConfig, context: any, delta: number) {
        const vrContext = (context as any).vr;
        if (!vrContext || !vrContext.hands) return;

        const now = Date.now();
        const handsToCheck: Array<{ name: string; hand: VRHand }> = [];

        if (config.hand === 'both' || config.hand === 'left') {
            if (vrContext.hands.left) handsToCheck.push({ name: 'left', hand: vrContext.hands.left });
        }
        if (config.hand === 'both' || config.hand === 'right') {
            if (vrContext.hands.right) handsToCheck.push({ name: 'right', hand: vrContext.hands.right });
        }

        for (const { name, hand } of handsToCheck) {
            const histKey = `${node.id}_${name}`;
            const history = getHistory(histKey);

            // Record position
            history.positions.push({ pos: hand.position, time: now });
            if (history.positions.length > MAX_HISTORY) {
                history.positions.shift();
            }

            // --- Pinch Detection ---
            const pinchStrength = hand.pinch || 0;
            if (pinchStrength >= config.pinchThreshold && !history.wasPinching) {
                history.wasPinching = true;
                emitGesture(node, context, config, history, 'pinch_start', now);
            } else if (pinchStrength < config.pinchThreshold && history.wasPinching) {
                history.wasPinching = false;
                emitGesture(node, context, config, history, 'pinch_end', now);
            }

            // --- Palm Open / Fist / Point Detection ---
            // These rely on finger extension data which we approximate from grip/trigger
            const grip = hand.grip;
            const trigger = hand.trigger;
            const pointing = hand.pointing;

            if (grip < 0.2 && trigger < 0.2 && pinchStrength < 0.3) {
                emitGesture(node, context, config, history, 'palm_open', now);
            } else if (grip > 0.8 && trigger > 0.8) {
                emitGesture(node, context, config, history, 'fist', now);
            } else if (pointing) {
                emitGesture(node, context, config, history, 'point', now);
            }

            // --- Swipe Detection ---
            if (history.positions.length >= 3) {
                const oldest = history.positions[0];
                const newest = history.positions[history.positions.length - 1];
                const timeDiff = (newest.time - oldest.time) / 1000; // seconds

                if (timeDiff > 0 && timeDiff < 0.5) { // Quick motion
                    const dx = (newest.pos as any).x - (oldest.pos as any).x;
                    const dy = (newest.pos as any).y - (oldest.pos as any).y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    const speed = dist / timeDiff;

                    if (speed > config.swipeThreshold && dist > config.swipeMinDistance) {
                        // Determine direction
                        if (Math.abs(dx) > Math.abs(dy)) {
                            // Horizontal swipe
                            emitGesture(node, context, config, history,
                                dx > 0 ? 'swipe_right' : 'swipe_left', now);
                        } else {
                            // Vertical swipe
                            emitGesture(node, context, config, history,
                                dy > 0 ? 'swipe_up' : 'swipe_down', now);
                        }
                        // Clear history to prevent duplicate detection
                        history.positions = [];
                    }
                }
            }
        }

        // Store last gesture on node
        const rightHistory = getHistory(`${node.id}_right`);
        if (node.properties) {
            (node.properties as any).lastGesture = rightHistory.lastGesture;
        }
    },
};

function emitGesture(
    node: HSPlusNode,
    context: any,
    config: GestureConfig,
    history: HandHistory,
    gesture: GestureType,
    now: number,
) {
    // Cooldown check
    if (now - history.lastGestureTime < config.gestureTimeout &&
        gesture === history.lastGesture) {
        return;
    }

    history.lastGestureTime = now;
    history.lastGesture = gesture;

    if (config.emitEvents && context.runtime) {
        context.runtime.emit(`gesture_${gesture}`, {
            nodeId: node.id,
            gesture,
            timestamp: now,
        });
    }
}
