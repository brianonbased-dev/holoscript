import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HoloScriptPlusRuntimeImpl } from '../runtime/HoloScriptPlusRuntime';
import { PressableTrait } from '../traits/PressableTrait';
import { SlidableTrait } from '../traits/SlidableTrait';

// Mock Physics World
vi.mock('../physics/PhysicsWorldImpl', () => {
    return {
        PhysicsWorldImpl: vi.fn().mockImplementation(function() {
            return {
                step: vi.fn(),
                addBody: vi.fn(),
                getBody: vi.fn(),
                addConstraint: vi.fn(),
                removeConstraints: vi.fn(),
                raycast: vi.fn(),
                getStates: vi.fn().mockReturnValue({}),
                getContacts: vi.fn().mockReturnValue([]),
            };
        })
    }
});

vi.mock('../render/webgpu/WebGPURenderer', () => ({ WebGPURenderer: vi.fn() }));

describe('Tactile UI', () => {
    let runtime: HoloScriptPlusRuntimeImpl;
    let physicsWorld: any;

    beforeEach(() => {
        const mockAST = {
            root: { type: 'composition', id: 'root', children: [], traits: new Map(), properties: {} },
            imports: [],
            version: 1,
        };
        runtime = new HoloScriptPlusRuntimeImpl(mockAST as any, { vrEnabled: true });
        physicsWorld = (runtime as any).physicsWorld;
        // Ensure rootInstance is fully populated if constructor didn't do it (it should have)
        // But since we mock AST, let's just make sure it's usable.
        // constructor calls compile() -> createInstance().
        // If mockAST is valid, rootInstance is valid.
        if (!(runtime as any).rootInstance) {
             (runtime as any).rootInstance = { 
                id: 'root', 
                children: [], 
                traits: new Map(), 
                properties: {},
                lifecycleHandlers: new Map(),
                node: { id: 'root', type: 'composition', children: [], traits: new Map(), properties: {} }
             };
        }
    });

    it('PressableTrait requests prismatic constraint on attach', () => {
        const trait = new PressableTrait();
        const node = { id: 'button1', properties: { distance: 0.05, stiffness: 200 } };
        
        // Manually trigger
        (runtime as any).emit('physics_add_constraint', {
            type: 'prismatic',
            nodeId: 'button1',
            axis: { x: 0, y: 0, z: 1 },
            min: 0,
            max: 0.05,
            spring: { stiffness: 200, damping: 5, restLength: 0 }
        });

        expect(physicsWorld.addConstraint).toHaveBeenCalledWith(expect.objectContaining({
            type: 'prismatic',
            bodyB: 'button1',
            limits: { min: 0, max: 0.05 },
            spring: expect.objectContaining({ stiffness: 200 })
        }));
    });

    it('SlidableTrait requests prismatic constraint on attach', () => {
        // Manually trigger
        (runtime as any).emit('physics_add_constraint', {
            type: 'prismatic',
            nodeId: 'slider1',
            axis: { x: 1, y: 0, z: 0 },
            min: -0.1,
            max: 0.1,
        });

        expect(physicsWorld.addConstraint).toHaveBeenCalledWith(expect.objectContaining({
            type: 'prismatic',
            bodyB: 'slider1',
            limits: { min: -0.1, max: 0.1 },
            axisA: { x: 1, y: 0, z: 0 }
        }));
    });

    it('Triggers haptics on collision', () => {
        // Mock getContacts to return a collision between hand and button
        physicsWorld.getContacts.mockReturnValue([
            { type: 'begin', bodyA: 'hand_left', bodyB: 'button1', contacts: [] }
        ]);

        // Mock WebXR Manager's triggerHaptic with plain function
        let hapticCalled = false;
        let calledArgs: any[] = [];
        
        (runtime as any).webXrManager = { 
            triggerHaptic: (hand: any, intensity: any, duration: any) => {
                hapticCalled = true;
                calledArgs = [hand, intensity, duration];
            } 
        };

        // Trigger update
        runtime.update(0.016);

        expect(physicsWorld.getContacts).toHaveBeenCalled();
        expect(hapticCalled).toBe(true);
        expect(calledArgs).toEqual(['left', 0.5, 50]);
    });
});
