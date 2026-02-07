/**
 * VisionOS Trait Mapping System
 *
 * Maps HoloScript traits to RealityKit components and Swift code.
 * Used by VisionOSCompiler for trait-to-native conversion.
 *
 * @version 1.0.0
 */

// =============================================================================
// TRAIT MAPPING TYPES
// =============================================================================

export type RealityKitComponent =
  | 'CollisionComponent'
  | 'PhysicsBodyComponent'
  | 'InputTargetComponent'
  | 'HoverEffectComponent'
  | 'ModelComponent'
  | 'SpatialAudioComponent'
  | 'AmbientAudioComponent'
  | 'AnchoringComponent'
  | 'AccessibilityComponent'
  | 'ImageBasedLightComponent'
  | 'PointLightComponent'
  | 'DirectionalLightComponent'
  | 'SpotLightComponent'
  | 'ParticleEmitterComponent'
  | 'VideoPlayerComponent'
  | 'PortalComponent'
  | 'WorldComponent'
  | 'OpacityComponent'
  | 'GroundingShadowComponent';

export type TraitImplementationLevel =
  | 'full' // Generates complete RealityKit code
  | 'partial' // Generates some code with TODOs
  | 'comment' // Only generates documentation comment
  | 'unsupported'; // Not available in RealityKit

export interface TraitMapping {
  /** HoloScript trait name */
  trait: string;
  /** RealityKit components to add */
  components: RealityKitComponent[];
  /** Implementation completeness */
  level: TraitImplementationLevel;
  /** Required Swift imports */
  imports?: string[];
  /** Required visionOS version */
  minVersion?: string;
  /** Code generator function */
  generate: (varName: string, config: Record<string, unknown>) => string[];
}

// =============================================================================
// PHYSICS TRAITS
// =============================================================================

export const PHYSICS_TRAIT_MAP: Record<string, TraitMapping> = {
  collidable: {
    trait: 'collidable',
    components: ['CollisionComponent'],
    level: 'full',
    generate: (varName, config) => {
      const mode = config.mode || 'default';
      return [
        `${varName}.components.set(CollisionComponent(shapes: [.generateConvex(from: ${varName}Mesh)], mode: .${mode}))`,
      ];
    },
  },

  physics: {
    trait: 'physics',
    components: ['CollisionComponent', 'PhysicsBodyComponent'],
    level: 'full',
    generate: (varName, config) => {
      const mass = config.mass ?? 1.0;
      const mode = config.kinematic ? 'kinematic' : 'dynamic';
      const friction = config.friction ?? 0.5;
      const restitution = config.restitution ?? 0.3;
      return [
        `${varName}.components.set(CollisionComponent(shapes: [.generateConvex(from: ${varName}Mesh)]))`,
        `var ${varName}Physics = PhysicsBodyComponent(massProperties: .init(mass: ${mass}), mode: .${mode})`,
        `${varName}Physics.material = .init(friction: ${friction}, restitution: ${restitution})`,
        `${varName}.components.set(${varName}Physics)`,
      ];
    },
  },

  static: {
    trait: 'static',
    components: ['CollisionComponent', 'PhysicsBodyComponent'],
    level: 'full',
    generate: (varName) => [
      `${varName}.components.set(CollisionComponent(shapes: [.generateConvex(from: ${varName}Mesh)]))`,
      `${varName}.components.set(PhysicsBodyComponent(mode: .static))`,
    ],
  },

  kinematic: {
    trait: 'kinematic',
    components: ['CollisionComponent', 'PhysicsBodyComponent'],
    level: 'full',
    generate: (varName) => [
      `${varName}.components.set(CollisionComponent(shapes: [.generateConvex(from: ${varName}Mesh)]))`,
      `${varName}.components.set(PhysicsBodyComponent(mode: .kinematic))`,
    ],
  },

  cloth: {
    trait: 'cloth',
    components: [],
    level: 'comment',
    generate: (varName, config) => [
      `// @cloth — requires custom Metal compute shader for cloth simulation`,
      `// Config: ${JSON.stringify(config)}`,
    ],
  },

  soft_body: {
    trait: 'soft_body',
    components: [],
    level: 'comment',
    generate: (varName, config) => [
      `// @soft_body — requires custom physics implementation`,
      `// Config: ${JSON.stringify(config)}`,
    ],
  },

  fluid: {
    trait: 'fluid',
    components: [],
    level: 'comment',
    generate: (varName, config) => [
      `// @fluid — requires SPH/FLIP fluid simulation via Metal`,
      `// Config: ${JSON.stringify(config)}`,
    ],
  },
};

// =============================================================================
// INTERACTION TRAITS
// =============================================================================

export const INTERACTION_TRAIT_MAP: Record<string, TraitMapping> = {
  grabbable: {
    trait: 'grabbable',
    components: ['CollisionComponent', 'PhysicsBodyComponent', 'InputTargetComponent'],
    level: 'full',
    generate: (varName, config) => {
      const mass = config.mass ?? 1.0;
      const snapToHand = config.snap_to_hand ?? false;
      const lines = [
        `${varName}.components.set(CollisionComponent(shapes: [.generateConvex(from: ${varName}Mesh)]))`,
        `${varName}.components.set(PhysicsBodyComponent(massProperties: .init(mass: ${mass}), mode: .dynamic))`,
        `${varName}.components.set(InputTargetComponent(allowedInputTypes: .indirect))`,
      ];
      if (snapToHand) {
        lines.push(`// snap_to_hand: true — implement via DragGesture handler`);
      }
      return lines;
    },
  },

  hoverable: {
    trait: 'hoverable',
    components: ['InputTargetComponent', 'HoverEffectComponent'],
    level: 'full',
    minVersion: '1.0',
    generate: (varName, config) => {
      const highlightColor = config.highlight_color || '#ffffff';
      return [
        `${varName}.components.set(InputTargetComponent())`,
        `${varName}.components.set(HoverEffectComponent())`,
        `// Highlight color: ${highlightColor} — configure via RealityKit material states`,
      ];
    },
  },

  clickable: {
    trait: 'clickable',
    components: ['InputTargetComponent', 'CollisionComponent'],
    level: 'full',
    generate: (varName) => [
      `${varName}.components.set(CollisionComponent(shapes: [.generateConvex(from: ${varName}Mesh)]))`,
      `${varName}.components.set(InputTargetComponent(allowedInputTypes: .indirect))`,
      `// Use .gesture(TapGesture().targetedToEntity(${varName})) for tap handling`,
    ],
  },

  draggable: {
    trait: 'draggable',
    components: ['InputTargetComponent', 'CollisionComponent'],
    level: 'full',
    generate: (varName, config) => {
      const axis = config.constrain_axis;
      const lines = [
        `${varName}.components.set(CollisionComponent(shapes: [.generateConvex(from: ${varName}Mesh)]))`,
        `${varName}.components.set(InputTargetComponent(allowedInputTypes: .indirect))`,
      ];
      if (axis) {
        lines.push(`// Constrain drag to axis: ${axis}`);
      }
      return lines;
    },
  },

  throwable: {
    trait: 'throwable',
    components: ['CollisionComponent', 'PhysicsBodyComponent', 'InputTargetComponent'],
    level: 'full',
    generate: (varName, config) => {
      const maxVelocity = config.max_velocity ?? 10;
      return [
        `${varName}.components.set(CollisionComponent(shapes: [.generateConvex(from: ${varName}Mesh)]))`,
        `${varName}.components.set(PhysicsBodyComponent(massProperties: .init(mass: 1.0), mode: .dynamic))`,
        `${varName}.components.set(InputTargetComponent())`,
        `// Max velocity: ${maxVelocity} — clamp in gesture handler`,
      ];
    },
  },

  pointable: {
    trait: 'pointable',
    components: ['InputTargetComponent'],
    level: 'full',
    generate: (varName) => [
      `${varName}.components.set(InputTargetComponent(allowedInputTypes: [.indirect, .direct]))`,
    ],
  },

  scalable: {
    trait: 'scalable',
    components: ['InputTargetComponent'],
    level: 'partial',
    generate: (varName, config) => {
      const minScale = config.min_scale ?? 0.1;
      const maxScale = config.max_scale ?? 10;
      return [
        `${varName}.components.set(InputTargetComponent())`,
        `// @scalable: min=${minScale}, max=${maxScale}`,
        `// Implement via MagnifyGesture`,
      ];
    },
  },

  rotatable: {
    trait: 'rotatable',
    components: ['InputTargetComponent'],
    level: 'partial',
    generate: (varName) => [
      `${varName}.components.set(InputTargetComponent())`,
      `// @rotatable — implement via RotateGesture3D`,
    ],
  },
};

// =============================================================================
// AUDIO TRAITS
// =============================================================================

export const AUDIO_TRAIT_MAP: Record<string, TraitMapping> = {
  audio: {
    trait: 'audio',
    components: ['AmbientAudioComponent'],
    level: 'full',
    imports: ['AVFoundation'],
    generate: (varName, config) => {
      const src = config.src || config.source || '';
      const loop = config.loop ?? false;
      return [
        `if let audioResource = try? await AudioFileResource(named: "${src}") {`,
        `    let controller = ${varName}.prepareAudio(audioResource)`,
        loop ? `    controller.gain = .decibels(-6)` : '',
        `    controller.play()`,
        `}`,
      ].filter(Boolean);
    },
  },

  spatial_audio: {
    trait: 'spatial_audio',
    components: ['SpatialAudioComponent'],
    level: 'full',
    generate: (varName, config) => {
      const refDistance = config.refDistance ?? 1.0;
      const rolloff = config.rolloff ?? 1.0;
      return [
        `var ${varName}SpatialAudio = SpatialAudioComponent()`,
        `${varName}SpatialAudio.gain = .decibels(0)`,
        `${varName}SpatialAudio.directivity = .beam(focus: 0.5)`,
        `${varName}.components.set(${varName}SpatialAudio)`,
        `// Reference distance: ${refDistance}, rolloff: ${rolloff}`,
      ];
    },
  },

  ambisonics: {
    trait: 'ambisonics',
    components: ['SpatialAudioComponent'],
    level: 'partial',
    generate: (varName, config) => [
      `${varName}.components.set(SpatialAudioComponent())`,
      `// @ambisonics: order=${config.order || 1} — RealityKit uses simplified spatial model`,
    ],
  },

  reverb_zone: {
    trait: 'reverb_zone',
    components: ['CollisionComponent'],
    level: 'partial',
    generate: (varName, config) => [
      `${varName}.components.set(CollisionComponent(shapes: [.generateBox(size: SIMD3<Float>(1, 1, 1))]))`,
      `// @reverb_zone: preset=${config.preset || 'room'} — use AudioUnitEQ for reverb`,
    ],
  },

  audio_occlusion: {
    trait: 'audio_occlusion',
    components: [],
    level: 'comment',
    generate: () => [`// @audio_occlusion — RealityKit handles automatically with scene geometry`],
  },

  head_tracked_audio: {
    trait: 'head_tracked_audio',
    components: ['SpatialAudioComponent'],
    level: 'full',
    generate: (varName) => [
      `var ${varName}Audio = SpatialAudioComponent()`,
      `${varName}Audio.isHeadTracked = true`,
      `${varName}.components.set(${varName}Audio)`,
    ],
  },
};

// =============================================================================
// AR/XR TRAITS
// =============================================================================

export const AR_TRAIT_MAP: Record<string, TraitMapping> = {
  anchor: {
    trait: 'anchor',
    components: ['AnchoringComponent'],
    level: 'full',
    generate: (varName, config) => {
      const target = String(config.anchor_type || 'plane');
      const targetMap: Record<string, string> = {
        plane: '.plane(.horizontal, classification: .any, minimumBounds: SIMD2<Float>(0.1, 0.1))',
        vertical: '.plane(.vertical, classification: .any, minimumBounds: SIMD2<Float>(0.1, 0.1))',
        image: '.image(group: "ImageTargets", name: "target")',
        face: '.face',
        hand: '.hand(.left, location: .palm)',
        world: '.world(transform: .identity)',
      };
      return [
        `${varName}.components.set(AnchoringComponent(${targetMap[target] || '.world(transform: .identity)'}))`,
      ];
    },
  },

  plane_detection: {
    trait: 'plane_detection',
    components: [],
    level: 'comment',
    generate: (_, config) => [
      `// @plane_detection — use PlaneDetectionProvider in RealityKit 2.0+`,
      `// Types: ${(config.types as string[])?.join(', ') || 'horizontal, vertical'}`,
    ],
  },

  mesh_detection: {
    trait: 'mesh_detection',
    components: [],
    level: 'comment',
    generate: () => [`// @mesh_detection — use SceneReconstructionProvider for mesh scanning`],
  },

  hand_tracking: {
    trait: 'hand_tracking',
    components: [],
    level: 'partial',
    generate: (_, config) => {
      const joints = config.joints || ['wrist', 'indexTip', 'thumbTip'];
      return [
        `// @hand_tracking — use HandTrackingProvider`,
        `// Tracked joints: ${(joints as string[]).join(', ')}`,
        `// Access via session.queryDeviceAnchor(atTimestamp:)`,
      ];
    },
  },

  eye_tracking: {
    trait: 'eye_tracking',
    components: [],
    level: 'partial',
    generate: () => [
      `// @eye_tracking — requires entitlement: com.apple.developer.arkit.eye-tracking`,
      `// Use ARKit's gaze ray for interaction`,
    ],
  },

  occlusion: {
    trait: 'occlusion',
    components: [],
    level: 'full',
    generate: (_varName) => [
      `// @occlusion — RealityKit handles automatically`,
      `// Ensure object has ModelComponent with proper materials`,
    ],
  },

  light_estimation: {
    trait: 'light_estimation',
    components: ['ImageBasedLightComponent'],
    level: 'full',
    generate: (varName) => [
      `// @light_estimation — ARKit provides environmental lighting automatically`,
      `${varName}.components.set(ImageBasedLightReceiverComponent(imageBasedLight: root))`,
    ],
  },

  world_anchor: {
    trait: 'world_anchor',
    components: ['AnchoringComponent'],
    level: 'full',
    generate: (varName, config) => {
      const persistent = config.persistent ?? true;
      return [
        `${varName}.components.set(AnchoringComponent(.world(transform: .identity)))`,
        persistent
          ? `// Persist via WorldTrackingProvider.addAnchor()`
          : `// Non-persistent world anchor`,
      ];
    },
  },

  geospatial: {
    trait: 'geospatial',
    components: ['AnchoringComponent'],
    level: 'comment',
    generate: (_, config) => [
      `// @geospatial — not natively supported on visionOS`,
      `// Latitude: ${config.latitude}, Longitude: ${config.longitude}`,
      `// Consider ARCore Geospatial API for cross-platform`,
    ],
  },
};

// =============================================================================
// VISUAL TRAITS
// =============================================================================

export const VISUAL_TRAIT_MAP: Record<string, TraitMapping> = {
  visible: {
    trait: 'visible',
    components: [],
    level: 'full',
    generate: (varName, config) => {
      const visible = config.visible ?? true;
      return [visible ? '' : `${varName}.isEnabled = false`].filter(Boolean);
    },
  },

  invisible: {
    trait: 'invisible',
    components: [],
    level: 'full',
    generate: (varName) => [`${varName}.isEnabled = false`],
  },

  billboard: {
    trait: 'billboard',
    components: [],
    level: 'partial',
    generate: (varName, config) => {
      const axis = config.lock_axis || null;
      return [
        `// @billboard — implement in update loop`,
        `// Lock axis: ${axis || 'none (full billboard)'}`,
        `// Use entity.look(at:from:upVector:relativeTo:) each frame`,
      ];
    },
  },

  particle_emitter: {
    trait: 'particle_emitter',
    components: ['ParticleEmitterComponent'],
    level: 'full',
    minVersion: '2.0',
    generate: (varName, config) => {
      const rate = config.rate ?? 100;
      const lifetime = config.lifetime ?? 1.0;
      return [
        `var ${varName}Particles = ParticleEmitterComponent()`,
        `${varName}Particles.emitterShape = .sphere`,
        `${varName}Particles.birthRate = ${rate}`,
        `${varName}Particles.lifeSpan = ${lifetime}`,
        `${varName}.components.set(${varName}Particles)`,
      ];
    },
  },

  animated: {
    trait: 'animated',
    components: [],
    level: 'partial',
    generate: (varName, config) => {
      const clip = config.clip || 'default';
      const loop = config.loop ?? true;
      return [
        `// @animated: clip="${clip}", loop=${loop}`,
        `if let animation = ${varName}.availableAnimations.first {`,
        `    ${varName}.playAnimation(animation${loop ? '.repeat()' : ''})`,
        `}`,
      ];
    },
  },

  lod: {
    trait: 'lod',
    components: [],
    level: 'comment',
    generate: (_, config) => [
      `// @lod — Level of Detail`,
      `// Distances: ${JSON.stringify(config.distances || [5, 15, 30])}`,
      `// Implement via custom component checking camera distance`,
    ],
  },

  shadow_caster: {
    trait: 'shadow_caster',
    components: ['GroundingShadowComponent'],
    level: 'full',
    generate: (varName) => [
      `${varName}.components.set(GroundingShadowComponent(castsShadow: true))`,
    ],
  },

  shadow_receiver: {
    trait: 'shadow_receiver',
    components: ['GroundingShadowComponent'],
    level: 'full',
    generate: (varName) => [
      `${varName}.components.set(GroundingShadowComponent(castsShadow: false))`,
    ],
  },
};

// =============================================================================
// ACCESSIBILITY TRAITS
// =============================================================================

export const ACCESSIBILITY_TRAIT_MAP: Record<string, TraitMapping> = {
  accessible: {
    trait: 'accessible',
    components: ['AccessibilityComponent'],
    level: 'full',
    generate: (varName, config) => {
      const label = config.label || '';
      const hint = config.hint || '';
      const isButton = config.isButton ?? false;
      const lines = [`var ${varName}Accessibility = AccessibilityComponent()`];
      if (label) lines.push(`${varName}Accessibility.label = "${label}"`);
      if (hint) lines.push(`${varName}Accessibility.hint = "${hint}"`);
      if (isButton) lines.push(`${varName}Accessibility.isButton = true`);
      lines.push(`${varName}.components.set(${varName}Accessibility)`);
      return lines;
    },
  },

  alt_text: {
    trait: 'alt_text',
    components: ['AccessibilityComponent'],
    level: 'full',
    generate: (varName, config) => {
      const text = config.text || '';
      return [
        `var ${varName}Accessibility = AccessibilityComponent()`,
        `${varName}Accessibility.label = "${text}"`,
        `${varName}.components.set(${varName}Accessibility)`,
      ];
    },
  },

  high_contrast: {
    trait: 'high_contrast',
    components: [],
    level: 'comment',
    generate: () => [
      `// @high_contrast — check UIAccessibility.isHighContrastEnabled`,
      `// Adjust material colors for better visibility`,
    ],
  },

  motion_reduced: {
    trait: 'motion_reduced',
    components: [],
    level: 'comment',
    generate: () => [
      `// @motion_reduced — check UIAccessibility.isReduceMotionEnabled`,
      `// Disable or simplify animations when true`,
    ],
  },
};

// =============================================================================
// UI TRAITS (SPATIAL)
// =============================================================================

export const UI_TRAIT_MAP: Record<string, TraitMapping> = {
  ui_floating: {
    trait: 'ui_floating',
    components: [],
    level: 'partial',
    generate: (varName, config) => {
      const followDelay = config.follow_delay ?? 0.3;
      const distance = config.distance ?? 1.5;
      return [
        `// @ui_floating — implement head-tracking update`,
        `// Follow delay: ${followDelay}s, distance: ${distance}m`,
        `// Update position in RealityView.update closure`,
      ];
    },
  },

  ui_anchored: {
    trait: 'ui_anchored',
    components: ['AnchoringComponent'],
    level: 'full',
    generate: (varName, config) => {
      const to = String(config.to || 'world');
      const anchorMap: Record<string, string> = {
        world: '.world(transform: .identity)',
        head: '.head',
        left_hand: '.hand(.left, location: .palm)',
        right_hand: '.hand(.right, location: .palm)',
      };
      return [
        `${varName}.components.set(AnchoringComponent(${anchorMap[to] || '.world(transform: .identity)'}))`,
      ];
    },
  },

  ui_hand_menu: {
    trait: 'ui_hand_menu',
    components: ['AnchoringComponent'],
    level: 'full',
    generate: (varName, config) => {
      const hand = config.hand || 'left';
      const trigger = config.trigger || 'palm_up';
      return [
        `${varName}.components.set(AnchoringComponent(.hand(.${hand}, location: .palm)))`,
        `// Trigger: ${trigger} — implement gesture detection`,
      ];
    },
  },

  ui_billboard: {
    trait: 'ui_billboard',
    components: [],
    level: 'partial',
    generate: (varName, config) => {
      const lockAxis = config.lock_axis || 'y';
      return [
        `// @ui_billboard — always face camera`,
        `// Lock axis: ${lockAxis}`,
        `// Update orientation in RealityView.update closure`,
      ];
    },
  },

  ui_docked: {
    trait: 'ui_docked',
    components: [],
    level: 'comment',
    generate: (_, config) => {
      const position = config.position || 'bottom';
      return [
        `// @ui_docked — dock to viewport edge`,
        `// Position: ${position}`,
        `// Use SwiftUI window attachment for docked UI`,
      ];
    },
  },
};

// =============================================================================
// PORTAL/VOLUME TRAITS (visionOS specific)
// =============================================================================

export const PORTAL_TRAIT_MAP: Record<string, TraitMapping> = {
  portal: {
    trait: 'portal',
    components: ['PortalComponent', 'WorldComponent'],
    level: 'full',
    minVersion: '1.0',
    generate: (varName, config) => {
      const _targetWorld = config.target_world || 'portalWorld';
      return [
        `let ${varName}World = Entity()`,
        `${varName}World.components.set(WorldComponent())`,
        `${varName}.components.set(PortalComponent(target: ${varName}World))`,
        `// Add content to ${varName}World for portal interior`,
      ];
    },
  },

  volume: {
    trait: 'volume',
    components: [],
    level: 'comment',
    generate: (_, config) => {
      const size = config.size || [1, 1, 1];
      return [
        `// @volume — volumetric window`,
        `// Size: ${JSON.stringify(size)}`,
        `// Use WindowGroup with volumetric style`,
      ];
    },
  },

  immersive: {
    trait: 'immersive',
    components: [],
    level: 'comment',
    generate: (_, config) => {
      const style = config.style || 'mixed';
      return [
        `// @immersive — ImmersiveSpace`,
        `// Style: ${style}`,
        `// Use ImmersiveSpace scene type in App`,
      ];
    },
  },
};

// =============================================================================
// COMBINED TRAIT MAP
// =============================================================================

export const VISIONOS_TRAIT_MAP: Record<string, TraitMapping> = {
  ...PHYSICS_TRAIT_MAP,
  ...INTERACTION_TRAIT_MAP,
  ...AUDIO_TRAIT_MAP,
  ...AR_TRAIT_MAP,
  ...VISUAL_TRAIT_MAP,
  ...ACCESSIBILITY_TRAIT_MAP,
  ...UI_TRAIT_MAP,
  ...PORTAL_TRAIT_MAP,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getTraitMapping(traitName: string): TraitMapping | undefined {
  return VISIONOS_TRAIT_MAP[traitName];
}

export function generateTraitCode(
  traitName: string,
  varName: string,
  config: Record<string, unknown>
): string[] {
  const mapping = getTraitMapping(traitName);
  if (!mapping) {
    return [`// @${traitName} — no mapping defined: ${JSON.stringify(config)}`];
  }
  return mapping.generate(varName, config);
}

export function getRequiredImports(traits: string[]): string[] {
  const imports = new Set<string>();
  for (const trait of traits) {
    const mapping = getTraitMapping(trait);
    if (mapping?.imports) {
      mapping.imports.forEach((i) => imports.add(i));
    }
  }
  return Array.from(imports);
}

export function getMinVisionOSVersion(traits: string[]): string {
  let maxVersion = '1.0';
  for (const trait of traits) {
    const mapping = getTraitMapping(trait);
    if (mapping?.minVersion) {
      if (parseFloat(mapping.minVersion) > parseFloat(maxVersion)) {
        maxVersion = mapping.minVersion;
      }
    }
  }
  return maxVersion;
}

export function listAllTraits(): string[] {
  return Object.keys(VISIONOS_TRAIT_MAP);
}

export function listTraitsByLevel(level: TraitImplementationLevel): string[] {
  return Object.entries(VISIONOS_TRAIT_MAP)
    .filter(([_, mapping]) => mapping.level === level)
    .map(([name]) => name);
}
