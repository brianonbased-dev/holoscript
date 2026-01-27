/**
 * HoloScript+ Type Definitions
 *
 * Enhanced HoloScript with VR interactions, state management, and TypeScript interop.
 * Backward compatible with original HoloScript - new features are opt-in via @ directives.
 */

// Re-export all researcher/viralist traits
export * from './ResearcherViralistTraits.js';

export type Vector3Tuple = [number, number, number];
export type Vector3 = Vector3Tuple;
export type Vector2 = [number, number];
export type Color = string;
export type Duration = `${number}${'ms' | 's' | 'm'}`;

export interface Transform {
  position: Vector3;
  rotation?: Vector3;
  scale?: Vector3 | number;
}

/**
 * VR interaction types
 */
export interface VRHand {
  id: 'left' | 'right';
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
  grip: number;
  trigger: number;
}

export interface ThrowVelocity {
  direction: Vector3;
  magnitude: number;
  angularVelocity: Vector3;
}

export interface CollisionEvent {
  target: HSPlusNode;
  point: Vector3;
  normal: Vector3;
  impulse: number;
  relativeVelocity: Vector3;
}

/**
 * VR Trait Configurations
 */
export interface GrabbableTrait {
  snap_to_hand?: boolean;
  two_handed?: boolean;
  haptic_on_grab?: number;
  grab_points?: Vector3[];
  preserve_rotation?: boolean;
  distance_grab?: boolean;
  max_grab_distance?: number;
}

export interface ThrowableTrait {
  velocity_multiplier?: number;
  gravity?: boolean;
  max_velocity?: number;
  spin?: boolean;
  bounce?: boolean;
  bounce_factor?: number;
}

export interface PointableTrait {
  highlight_on_point?: boolean;
  highlight_color?: Color;
  cursor_style?: 'default' | 'pointer' | 'grab' | 'crosshair';
}

export interface HoverableTrait {
  highlight_color?: Color;
  scale_on_hover?: number;
  show_tooltip?: string | boolean;
  tooltip_offset?: Vector3;
  glow?: boolean;
  glow_intensity?: number;
}

export interface ScalableTrait {
  min_scale?: number;
  max_scale?: number;
  uniform?: boolean;
  pivot?: Vector3;
}

export interface RotatableTrait {
  axis?: 'x' | 'y' | 'z' | 'all';
  snap_angles?: number[];
  speed?: number;
}

export interface StackableTrait {
  stack_axis?: 'x' | 'y' | 'z';
  stack_offset?: number;
  max_stack?: number;
  snap_distance?: number;
}

export interface SnappableTrait {
  snap_points?: Vector3[];
  snap_distance?: number;
  snap_rotation?: boolean;
  magnetic?: boolean;
}

export interface BreakableTrait {
  break_velocity?: number;
  fragments?: number;
  fragment_mesh?: string;
  sound_on_break?: string;
  respawn?: boolean;
  respawn_delay?: Duration;
}

/**
 * @stretchable - Deformable mesh manipulation for molding, building atoms, and creative sculpting
 *
 * Use cases:
 * - Atomic/molecular building (stretch bonds between atoms)
 * - Clay/putty sculpting
 * - Elastic objects that deform under force
 * - Scientific visualization of molecular structures
 *
 * @example
 * ```holoscript
 * sphere#atom @stretchable(mode: "bond", snap_to: "atoms", elasticity: 0.8) {
 *   color: "#ff0000"
 *   @on_stretch(delta) => update_bond_visualization(delta)
 * }
 * ```
 */
export interface StretchableTrait {
  /** Stretch mode: 'free' | 'axis' | 'bond' | 'surface' | 'volume' */
  mode?: 'free' | 'axis' | 'bond' | 'surface' | 'volume';
  /** Which axis/axes to allow stretching on */
  axis?: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'all';
  /** Minimum stretch factor (0.1 = can shrink to 10%) */
  min_stretch?: number;
  /** Maximum stretch factor (10 = can grow to 1000%) */
  max_stretch?: number;
  /** Elasticity - how much it snaps back (0 = permanent, 1 = fully elastic) */
  elasticity?: number;
  /** Snap distance for connecting to other stretchable objects */
  snap_distance?: number;
  /** Object types/tags this can snap/bond to */
  snap_to?: string | string[];
  /** Whether to preserve volume when stretching (like clay) */
  preserve_volume?: boolean;
  /** Resolution of deformation mesh (higher = smoother but more expensive) */
  mesh_resolution?: number;
  /** Haptic feedback intensity when stretching */
  haptic_feedback?: number;
  /** Sound to play while stretching */
  stretch_sound?: string;
  /** Visual indicator for stretch limits */
  show_stretch_limits?: boolean;
  /** Color gradient for stretch visualization (cold to hot) */
  stretch_colors?: [Color, Color];
  /** Whether two hands are required to stretch */
  two_handed?: boolean;
  /** Bond type for molecular building: 'single' | 'double' | 'triple' | 'ionic' */
  bond_type?: 'single' | 'double' | 'triple' | 'ionic' | 'hydrogen' | 'custom';
  /** Visual style for bonds */
  bond_style?: 'stick' | 'ball-stick' | 'space-fill' | 'wireframe';
}

/**
 * @moldable - Advanced sculpting trait for clay-like deformation
 *
 * @example
 * ```holoscript
 * mesh#clay @moldable(tool: "fingers", softness: 0.7) {
 *   @on_sculpt(region, pressure) => update_mesh(region, pressure)
 * }
 * ```
 */
export interface MoldableTrait {
  /** Sculpting tool type */
  tool?: 'fingers' | 'brush' | 'knife' | 'smooth' | 'pinch' | 'inflate';
  /** How soft/deformable the material is (0 = hard, 1 = very soft) */
  softness?: number;
  /** Brush/tool radius */
  tool_radius?: number;
  /** Pressure sensitivity multiplier */
  pressure_sensitivity?: number;
  /** Whether to enable symmetry sculpting */
  symmetry?: boolean | 'x' | 'y' | 'z';
  /** Maximum deformation depth */
  max_depth?: number;
  /** Enable undo history */
  undo_enabled?: boolean;
  /** Number of undo steps to keep */
  undo_steps?: number;
  /** Auto-smooth after sculpting */
  auto_smooth?: boolean;
  /** Material properties for rendering */
  material?: 'clay' | 'metal' | 'organic' | 'crystal';
}

// ============================================================================
// HUMANOID / AVATAR TRAITS - Building human-like features
// ============================================================================

/**
 * @skeleton - Rigging and skeletal system for humanoid characters
 *
 * @example
 * ```holoscript
 * avatar#player @skeleton(type: "humanoid", ik_enabled: true) {
 *   @on_pose_change(pose) => sync_animation(pose)
 * }
 * ```
 */
export interface SkeletonTrait {
  /** Skeleton type preset */
  type?: 'humanoid' | 'quadruped' | 'bird' | 'spider' | 'custom';
  /** Enable inverse kinematics */
  ik_enabled?: boolean;
  /** IK targets for limbs */
  ik_targets?: {
    left_hand?: string;
    right_hand?: string;
    left_foot?: string;
    right_foot?: string;
    head?: string;
    spine?: string;
  };
  /** Bone constraints */
  constraints?: Record<string, { min: Vector3; max: Vector3 }>;
  /** Root bone name */
  root_bone?: string;
  /** Enable physics-based secondary motion (hair, cloth, etc.) */
  secondary_motion?: boolean;
  /** Retargeting source for animations */
  retarget_source?: string;
}

/**
 * @body - Body configuration for humanoid avatars
 *
 * @example
 * ```holoscript
 * avatar#custom @body(preset: "athletic", height: 1.8, proportions: "realistic") {
 *   skin_tone: "#e8beac"
 *   body_type: "mesomorph"
 * }
 * ```
 */
export interface BodyTrait {
  /** Body preset */
  preset?: 'default' | 'athletic' | 'slim' | 'heavy' | 'child' | 'elderly' | 'custom';
  /** Height in meters */
  height?: number;
  /** Body proportions style */
  proportions?: 'realistic' | 'stylized' | 'cartoon' | 'chibi' | 'heroic';
  /** Body type/somatotype */
  body_type?: 'ectomorph' | 'mesomorph' | 'endomorph' | 'average';
  /** Muscle definition (0-1) */
  muscle_definition?: number;
  /** Body fat percentage visual (0-1) */
  body_fat?: number;
  /** Shoulder width multiplier */
  shoulder_width?: number;
  /** Hip width multiplier */
  hip_width?: number;
  /** Limb length multipliers */
  limb_proportions?: {
    arms?: number;
    legs?: number;
    torso?: number;
    neck?: number;
  };
  /** Gender presentation */
  gender_expression?: 'masculine' | 'feminine' | 'androgynous' | 'neutral';
  /** Age appearance (affects skin, posture, etc.) */
  apparent_age?: number;
}

/**
 * @face - Facial features and structure
 *
 * @example
 * ```holoscript
 * head#playerHead @face(shape: "oval", ethnicity_blend: ["european", "asian"]) {
 *   eye_color: "#3b7a57"
 *   @expressive(auto_blink: true, lip_sync: true)
 * }
 * ```
 */
export interface FaceTrait {
  /** Face shape preset */
  shape?: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond' | 'triangle';
  /** Ethnicity blend for facial features (can mix multiple) */
  ethnicity_blend?: string[];
  /** Eye settings */
  eyes?: {
    shape?: 'almond' | 'round' | 'hooded' | 'monolid' | 'upturned' | 'downturned';
    color?: Color;
    size?: number;
    spacing?: number;
    iris_detail?: 'simple' | 'detailed' | 'realistic';
    heterochromia?: boolean;
    secondary_color?: Color;
  };
  /** Nose settings */
  nose?: {
    shape?: 'straight' | 'roman' | 'button' | 'aquiline' | 'flat' | 'upturned';
    width?: number;
    length?: number;
    bridge_height?: number;
  };
  /** Mouth/lips settings */
  mouth?: {
    shape?: 'thin' | 'full' | 'bow' | 'wide' | 'small';
    width?: number;
    lip_thickness?: { upper: number; lower: number };
  };
  /** Jaw and chin */
  jaw?: {
    width?: number;
    chin_shape?: 'pointed' | 'rounded' | 'square' | 'cleft';
    chin_prominence?: number;
  };
  /** Cheekbone prominence */
  cheekbones?: number;
  /** Brow settings */
  brow?: {
    thickness?: number;
    arch?: number;
    spacing?: number;
  };
  /** Ear settings */
  ears?: {
    size?: number;
    shape?: 'attached' | 'free' | 'pointed' | 'rounded';
    protrusion?: number;
  };
  /** Forehead height */
  forehead_height?: number;
  /** Facial hair (for applicable characters) */
  facial_hair?: {
    type?: 'none' | 'stubble' | 'beard' | 'mustache' | 'goatee' | 'full';
    density?: number;
    color?: Color;
    style?: string;
  };
  /** Skin details */
  skin?: {
    tone?: Color;
    texture?: 'smooth' | 'normal' | 'rough' | 'weathered';
    freckles?: number;
    moles?: Array<{ position: Vector2; size: number }>;
    wrinkles?: number;
    pores?: number;
    subsurface_scattering?: number;
  };
}

/**
 * @expressive - Facial expressions and emotion system
 *
 * @example
 * ```holoscript
 * avatar#npc @expressive(blend_shapes: true, micro_expressions: true) {
 *   @on_emotion_change(emotion) => play_expression(emotion)
 * }
 * ```
 */
export interface ExpressiveTrait {
  /** Enable blend shape morphs */
  blend_shapes?: boolean;
  /** Emotion presets available */
  emotions?: Array<'happy' | 'sad' | 'angry' | 'surprised' | 'disgusted' | 'fearful' | 'neutral' | 'contempt'>;
  /** Custom blend shape mappings */
  blend_shape_map?: Record<string, string>;
  /** Auto-blink behavior */
  auto_blink?: boolean;
  /** Blink frequency (per minute) */
  blink_rate?: number;
  /** Enable micro-expressions for realism */
  micro_expressions?: boolean;
  /** Eye movement behavior */
  eye_behavior?: {
    look_at_target?: boolean;
    saccades?: boolean;
    pupil_dilation?: boolean;
  };
  /** Lip sync configuration */
  lip_sync?: boolean | {
    method?: 'viseme' | 'phoneme' | 'ai';
    smoothing?: number;
    exaggeration?: number;
  };
  /** Breathing animation */
  breathing?: boolean;
  /** Current emotion state */
  default_emotion?: string;
  /** Emotion transition speed */
  transition_speed?: number;
}

/**
 * @hair - Hair and hairstyle system
 *
 * @example
 * ```holoscript
 * hair#playerHair @hair(style: "long_wavy", physics: true) {
 *   color: "#2c1810"
 *   highlights: "#4a3728"
 * }
 * ```
 */
export interface HairTrait {
  /** Hair style preset */
  style?: string; // 'short' | 'medium' | 'long' | 'buzz' | 'bald' | 'afro' | 'braids' | 'ponytail' | etc.
  /** Primary hair color */
  color?: Color;
  /** Highlight/secondary color */
  highlights?: Color;
  /** Hair texture */
  texture?: 'straight' | 'wavy' | 'curly' | 'coily' | 'kinky';
  /** Hair thickness/density */
  density?: number;
  /** Strand thickness */
  thickness?: number;
  /** Hair length (0-1 normalized) */
  length?: number;
  /** Enable physics simulation */
  physics?: boolean;
  /** Physics stiffness */
  stiffness?: number;
  /** Wind/movement response */
  wind_response?: number;
  /** Hair shine/specular */
  shine?: number;
  /** Render method */
  render_method?: 'cards' | 'strands' | 'mesh';
  /** LOD levels for performance */
  lod_levels?: number;
}

/**
 * @clothing - Clothing and outfit system
 *
 * @example
 * ```holoscript
 * outfit#casual @clothing(type: "full_body", physics: "cloth") {
 *   style: "casual_modern"
 *   fit: "relaxed"
 * }
 * ```
 */
export interface ClothingTrait {
  /** Clothing slot type */
  type?: 'full_body' | 'top' | 'bottom' | 'shoes' | 'accessory' | 'hat' | 'glasses' | 'jewelry';
  /** Clothing style category */
  style?: string;
  /** Fit type */
  fit?: 'tight' | 'fitted' | 'relaxed' | 'loose' | 'oversized';
  /** Primary color/material */
  color?: Color;
  /** Material type */
  material?: 'cotton' | 'silk' | 'leather' | 'denim' | 'wool' | 'synthetic' | 'metal';
  /** Physics simulation type */
  physics?: 'none' | 'cloth' | 'rigid' | 'soft_body';
  /** Cloth simulation settings */
  cloth_settings?: {
    stiffness?: number;
    damping?: number;
    collision_margin?: number;
    wind_response?: number;
  };
  /** Layer order (for layered clothing) */
  layer?: number;
  /** Body parts this hides/masks */
  masks_body?: string[];
  /** Pattern/texture overlay */
  pattern?: string;
}

/**
 * @hands - Detailed hand configuration and gestures
 *
 * @example
 * ```holoscript
 * hands#playerHands @hands(tracking: "full", gestures: true) {
 *   @on_gesture(type) => handle_gesture(type)
 * }
 * ```
 */
export interface HandsTrait {
  /** Hand tracking mode */
  tracking?: 'controller' | 'skeletal' | 'full' | 'none';
  /** Enable gesture recognition */
  gestures?: boolean;
  /** Available gestures */
  gesture_set?: Array<'point' | 'fist' | 'open' | 'pinch' | 'thumbs_up' | 'peace' | 'ok' | 'custom'>;
  /** Custom gesture definitions */
  custom_gestures?: Record<string, unknown>;
  /** Finger curl tracking precision */
  finger_precision?: 'low' | 'medium' | 'high';
  /** Hand size multiplier */
  size?: number;
  /** Nail appearance */
  nails?: {
    length?: 'short' | 'medium' | 'long';
    shape?: 'square' | 'rounded' | 'pointed' | 'almond';
    color?: Color;
  };
  /** Skin details for hands */
  skin_detail?: 'low' | 'medium' | 'high';
  /** Ring/jewelry attachment points */
  accessory_slots?: string[];
}

/**
 * @voice - Voice and speech synthesis for characters
 *
 * @example
 * ```holoscript
 * avatar#assistant @voice(type: "synthesis", voice_id: "aria") {
 *   @on_speak(text) => animate_lip_sync(text)
 * }
 * ```
 */
export interface CharacterVoiceTrait {
  /** Voice type */
  type?: 'recorded' | 'synthesis' | 'clone' | 'realtime';
  /** Voice ID for synthesis */
  voice_id?: string;
  /** Voice preset characteristics */
  preset?: 'male_deep' | 'male_tenor' | 'female_alto' | 'female_soprano' | 'child' | 'robot' | 'custom';
  /** Pitch adjustment (-1 to 1) */
  pitch?: number;
  /** Speaking rate (0.5 to 2) */
  rate?: number;
  /** Voice warmth/coldness */
  warmth?: number;
  /** Breathiness */
  breathiness?: number;
  /** Accent/dialect */
  accent?: string;
  /** Language */
  language?: string;
  /** Enable emotion in voice */
  emotional?: boolean;
  /** SSML support */
  ssml_enabled?: boolean;
}

/**
 * @locomotion - Movement and animation system
 *
 * @example
 * ```holoscript
 * avatar#player @locomotion(style: "realistic", root_motion: true) {
 *   walk_speed: 1.4
 *   run_speed: 5.0
 * }
 * ```
 */
export interface LocomotionTrait {
  /** Movement style */
  style?: 'realistic' | 'stylized' | 'robotic' | 'floaty' | 'heavy';
  /** Use root motion from animations */
  root_motion?: boolean;
  /** Walking speed (m/s) */
  walk_speed?: number;
  /** Running speed (m/s) */
  run_speed?: number;
  /** Jump height (m) */
  jump_height?: number;
  /** Turn speed (degrees/second) */
  turn_speed?: number;
  /** Acceleration */
  acceleration?: number;
  /** Enable procedural foot placement (IK) */
  foot_ik?: boolean;
  /** Terrain adaptation */
  terrain_adaptation?: boolean;
  /** Idle animations */
  idle_variations?: number;
  /** Breathing motion in idle */
  idle_breathing?: boolean;
  /** Weight shift in idle */
  weight_shift?: boolean;
  /** Stamina system */
  stamina?: {
    max?: number;
    drain_rate?: number;
    recovery_rate?: number;
  };
}

/**
 * @poseable - Manual posing system for characters
 *
 * @example
 * ```holoscript
 * avatar#model @poseable(mode: "ik", snap_to_presets: true) {
 *   @on_pose_save(pose) => save_to_library(pose)
 * }
 * ```
 */
export interface PoseableTrait {
  /** Posing mode */
  mode?: 'fk' | 'ik' | 'hybrid';
  /** Enable preset pose snapping */
  snap_to_presets?: boolean;
  /** Preset poses available */
  presets?: string[];
  /** Symmetry posing */
  symmetry?: boolean;
  /** Pin/lock specific bones */
  pinned_bones?: string[];
  /** Enable physics preview */
  physics_preview?: boolean;
  /** Pose blending between presets */
  blend_enabled?: boolean;
  /** Save custom poses */
  custom_poses?: Record<string, unknown>;
}

/**
 * @morph - Shape morphing and body customization
 *
 * @example
 * ```holoscript
 * avatar#custom @morph(targets: ["body_shape", "face_detail"]) {
 *   @on_morph_change(target, value) => update_avatar(target, value)
 * }
 * ```
 */
export interface MorphTrait {
  /** Available morph targets */
  targets?: string[];
  /** Morph target values (0-1) */
  values?: Record<string, number>;
  /** Morph presets */
  presets?: Record<string, Record<string, number>>;
  /** Enable real-time preview */
  realtime_preview?: boolean;
  /** Morph transition speed */
  transition_speed?: number;
  /** Clamp values to valid ranges */
  clamp_values?: boolean;
  /** Linked morphs (one affects another) */
  linked_morphs?: Record<string, string[]>;
}

export interface NetworkedTrait {
  sync_mode?: 'reliable' | 'unreliable' | 'state-only';
  authority?: 'client' | 'server' | 'owner';
  sync_interval?: number;
  interpolated?: boolean;
}

// ============================================================================
// ENVIRONMENT UNDERSTANDING TRAITS (Phase 1)
// ============================================================================

/** @plane_detection - Detect real-world surfaces for mixed reality */
export interface PlaneDetectionTrait {
  mode?: 'horizontal' | 'vertical' | 'all';
  min_area?: number;
  max_planes?: number;
  update_interval?: number;
  visual_mesh?: boolean;
  classification?: boolean;
  semantic_labels?: boolean;
}

/** @mesh_detection - Real-world mesh scanning for occlusion and physics */
export interface MeshDetectionTrait {
  classification?: boolean;
  mesh_quality?: 'low' | 'medium' | 'high';
  update_rate?: number;
  physics_collider?: boolean;
  occlusion_mesh?: boolean;
  normals?: boolean;
}

/** @anchor - Spatial anchor for attaching content to physical locations */
export interface AnchorTrait {
  anchor_type?: 'spatial' | 'plane' | 'image' | 'face' | 'hand';
  tracking_quality?: 'low' | 'high';
  offset?: Vector3;
  alignment?: 'gravity' | 'plane_normal' | 'none';
  fallback_behavior?: 'hide' | 'freeze' | 'estimate';
}

/** @persistent_anchor - Anchor that survives session restarts */
export interface PersistentAnchorTrait {
  storage?: 'local' | 'cloud';
  ttl?: number;
  auto_resolve?: boolean;
  name?: string;
  fallback_position?: Vector3;
}

/** @shared_anchor - Multi-user anchor sharing for co-located MR */
export interface SharedAnchorTrait {
  authority?: 'creator' | 'host' | 'first_resolver';
  resolution_timeout?: number;
  max_users?: number;
  sync_interval?: number;
  cloud_provider?: 'azure' | 'arcore' | 'custom';
}

/** @geospatial - GPS/lat-lon world-scale anchoring */
export interface GeospatialTraitConfig {
  latitude: number;
  longitude: number;
  altitude?: number;
  altitude_type?: 'wgs84' | 'terrain' | 'rooftop';
  heading?: number;
  heading_alignment?: boolean;
  accuracy_threshold?: number;
}

/** @occlusion - Real-world objects occlude virtual content */
export interface OcclusionTraitConfig {
  mode?: 'environment' | 'people' | 'both';
  depth_quality?: 'fast' | 'best';
  edge_smoothing?: boolean;
  temporal_smoothing?: boolean;
  custom_materials?: boolean;
}

/** @light_estimation - Match virtual lighting to real environment */
export interface LightEstimationTrait {
  mode?: 'ambient_intensity' | 'environmental_probe' | 'directional' | 'spherical_harmonics';
  auto_apply?: boolean;
  update_rate?: number;
  shadow_estimation?: boolean;
  color_temperature?: boolean;
}

// ============================================================================
// INPUT MODALITY TRAITS (Phase 2)
// ============================================================================

/** @eye_tracking - Gaze direction, dwell time, fixation targets */
export interface EyeTrackingTrait {
  fixation_detection?: boolean;
  saccade_detection?: boolean;
  pupil_metrics?: boolean;
  dwell_threshold?: number;
  gaze_ray?: boolean;
  smooth_factor?: number;
  calibration?: 'auto' | 'manual' | 'none';
}

/** @hand_tracking - Articulated hand skeleton tracking */
export interface HandTrackingTrait {
  mode?: 'skeletal' | 'gesture_only' | 'hybrid';
  gesture_set?: string[];
  pinch_threshold?: number;
  tracked_joints?: string[];
  haptic_on_gesture?: boolean;
  prediction?: boolean;
  update_rate?: 30 | 60 | 90;
}

/** @controller - 6DOF controller input */
export interface ControllerTraitConfig {
  haptic_on_button?: boolean;
  deadzone?: number;
  button_mapping?: Record<string, string>;
  trigger_threshold?: number;
  grip_threshold?: number;
  thumbstick_sensitivity?: number;
}

/** @spatial_accessory - External tracked peripherals */
export interface SpatialAccessoryTrait {
  device_type?: 'stylus' | 'keyboard' | 'mouse' | 'gamepad' | 'custom';
  tracking_mode?: 'optical' | 'imu' | 'hybrid';
  haptic_feedback?: boolean;
  pressure_sensitivity?: boolean;
  button_count?: number;
}

/** @body_tracking - Full body pose estimation */
export interface BodyTrackingTrait {
  tracked_joints?: string[];
  confidence_threshold?: number;
  smoothing?: number;
  prediction?: boolean;
  floor_detection?: boolean;
  seated_mode?: boolean;
}

/** @face_tracking - Facial expression capture */
export interface FaceTrackingTraitConfig {
  blend_shapes?: boolean;
  expressions?: string[];
  update_rate?: number;
  mirror?: boolean;
  confidence_threshold?: number;
  tongue_tracking?: boolean;
}

// ============================================================================
// ACCESSIBILITY TRAITS (Phase 3)
// ============================================================================

/** @accessible - Master accessibility trait */
export interface AccessibleTrait {
  role?: 'button' | 'link' | 'image' | 'region' | 'landmark' | 'dialog' | 'alert' | 'navigation' | 'list' | 'listitem' | 'complementary' | 'custom';
  label: string;
  description?: string;
  live_region?: 'off' | 'polite' | 'assertive';
  keyboard_shortcut?: string;
  tab_index?: number;
  focus_visible?: boolean;
}

/** @alt_text - Alternative text description for 3D objects */
export interface AltTextTrait {
  text: string;
  verbose?: string;
  language?: string;
  auto_generate?: boolean;
}

/** @spatial_audio_cue - Audio landmarks for blind navigation */
export interface SpatialAudioCueTrait {
  cue_type?: 'navigation' | 'notification' | 'feedback' | 'landmark' | 'boundary';
  earcon?: string;
  spatial?: boolean;
  repeat_interval?: number;
  volume?: number;
  priority?: 'low' | 'medium' | 'high';
}

/** @sonification - Map data/state to audio */
export interface SonificationTrait {
  data_source: string;
  mapping?: 'pitch' | 'volume' | 'pan' | 'tempo' | 'timbre';
  min_freq?: number;
  max_freq?: number;
  pan_mode?: 'stereo' | 'spatial';
  continuous?: boolean;
  instrument?: string;
}

/** @haptic_cue - Non-visual feedback for interactions */
export interface HapticCueTrait {
  pattern?: 'pulse' | 'buzz' | 'rumble' | 'click' | 'texture' | 'heartbeat' | 'custom';
  intensity?: number;
  duration?: number;
  repeat?: number;
  spatial_direction?: boolean;
}

/** @magnifiable - Content scaling for low-vision users */
export interface MagnifiableTrait {
  min_scale?: number;
  max_scale?: number;
  trigger?: 'gaze_dwell' | 'pinch' | 'button' | 'proximity';
  smooth_zoom?: boolean;
  lens_mode?: boolean;
  lens_size?: number;
}

/** @high_contrast - High contrast visual mode */
export interface HighContrastTrait {
  mode?: 'auto' | 'light' | 'dark' | 'custom';
  outline_color?: Color;
  outline_width?: number;
  background_color?: Color;
  text_color?: Color;
  forced_colors?: boolean;
}

/** @motion_reduced - Reduced motion for vestibular sensitivity */
export interface MotionReducedTrait {
  disable_parallax?: boolean;
  reduce_animations?: boolean;
  static_ui?: boolean;
  max_velocity?: number;
  disable_camera_shake?: boolean;
  teleport_instead_of_smooth?: boolean;
}

/** @subtitle - Real-time speech-to-text overlay */
export interface SubtitleTrait {
  language?: string;
  position?: 'top' | 'bottom' | 'floating' | 'attached';
  font_size?: number;
  background?: boolean;
  background_opacity?: number;
  max_lines?: number;
  auto_translate?: string[];
  speaker_colors?: boolean;
}

/** @screen_reader - Expose semantic structure to 3D screen readers */
export interface ScreenReaderTrait {
  semantic_structure?: boolean;
  navigation_order?: number;
  announce_changes?: boolean;
  reading_mode?: 'spatial' | 'linear' | 'hierarchical';
  sonify_position?: boolean;
  distance_scaling?: boolean;
}

// ============================================================================
// GAUSSIAN SPLATTING & VOLUMETRIC CONTENT TRAITS (Phase 4)
// ============================================================================

/** @gaussian_splat - Load/render 3D Gaussian Splatting scenes */
export interface GaussianSplatTrait {
  source: string;
  format?: 'ply' | 'splat' | 'spz' | 'gltf';
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  max_splats?: number;
  sort_mode?: 'distance' | 'opacity';
  streaming?: boolean;
  compression?: boolean;
  sh_degree?: number;
}

/** @nerf - Neural Radiance Field rendering */
export interface NerfTrait {
  model_url: string;
  resolution?: number;
  render_mode?: 'volume' | 'mesh_extraction' | 'hybrid';
  quality?: 'fast' | 'balanced' | 'high';
  cache_frames?: boolean;
  near_plane?: number;
  far_plane?: number;
}

/** @volumetric_video - 4D Gaussian Splatting / volumetric capture playback */
export interface VolumetricVideoTrait {
  source: string;
  format?: '4dgs' | 'draco' | 'v3d' | 'holo_capture';
  loop?: boolean;
  playback_rate?: number;
  preload?: boolean;
  buffer_size?: number;
  spatial_audio?: boolean;
}

/** @point_cloud - Raw point cloud rendering */
export interface PointCloudTrait {
  source: string;
  point_size?: number;
  color_mode?: 'rgb' | 'intensity' | 'classification' | 'height' | 'custom';
  max_points?: number;
  lod?: boolean;
  lod_levels?: number;
  streaming?: boolean;
  format?: 'las' | 'laz' | 'ply' | 'xyz' | 'e57';
}

/** @photogrammetry - Photo-derived 3D model integration */
export interface PhotogrammetryTrait {
  source_type?: 'images' | 'lidar' | 'depth' | 'gaussian_splat';
  quality?: 'draft' | 'medium' | 'high' | 'ultra';
  mesh_simplification?: number;
  texture_resolution?: number;
  auto_align?: boolean;
  geo_reference?: boolean;
}

// ============================================================================
// WEBGPU COMPUTE TRAITS (Phase 5)
// ============================================================================

/** @compute - Declare a GPU compute shader workload */
export interface ComputeTrait {
  workgroup_size?: [number, number, number];
  dispatch?: [number, number, number];
  shader_source?: string;
  shader_url?: string;
  bindings?: Record<string, string>;
  auto_dispatch?: boolean;
}

/** @gpu_particle - GPU-accelerated particle system */
export interface GPUParticleTrait {
  count: number;
  emission_rate?: number;
  lifetime?: number;
  forces?: Array<{ type: 'gravity' | 'wind' | 'vortex' | 'attractor' | 'noise'; strength: number; direction?: Vector3 }>;
  color_over_life?: Color[];
  size_over_life?: number[];
  collision?: boolean;
  spatial_hash?: boolean;
}

/** @gpu_physics - GPU-side physics simulation */
export interface GPUPhysicsTrait {
  sim_type?: 'cloth' | 'fluid' | 'soft_body' | 'particles' | 'sph';
  resolution?: number;
  substeps?: number;
  method?: 'pbd' | 'mls_mpm' | 'sph' | 'fem';
  gravity?: Vector3;
  damping?: number;
  collision_geometry?: string;
}

/** @gpu_buffer - Explicit GPU buffer management */
export interface GPUBufferTrait {
  size: number;
  usage?: 'storage' | 'uniform' | 'vertex' | 'index' | 'indirect';
  initial_data?: string;
  shared?: boolean;
  label?: string;
  mapped_at_creation?: boolean;
}

// ============================================================================
// DIGITAL TWIN & IOT TRAITS (Phase 6)
// ============================================================================

/** @sensor - Bind to IoT data stream */
export interface SensorTrait {
  protocol?: 'mqtt' | 'opcua' | 'rest' | 'websocket' | 'modbus';
  endpoint: string;
  topic?: string;
  data_type?: 'number' | 'boolean' | 'string' | 'json' | 'binary';
  update_interval?: number;
  unit?: string;
  range?: { min: number; max: number };
  alarm_thresholds?: { warning?: number; critical?: number };
}

/** @digital_twin - Map physical object to virtual representation */
export interface DigitalTwinTrait {
  physical_id: string;
  model_source?: string;
  sync_properties?: string[];
  update_mode?: 'realtime' | 'polling' | 'event_driven';
  poll_interval?: number;
  history_retention?: number;
  simulation_mode?: boolean;
}

/** @data_binding - Bind entity properties to live data feeds */
export interface DataBindingTrait {
  source: string;
  bindings: Array<{
    property: string;
    data_path: string;
    transform?: 'linear' | 'logarithmic' | 'step' | 'custom';
    min_value?: number;
    max_value?: number;
  }>;
  refresh_rate?: number;
  interpolation?: boolean;
}

/** @alert - Trigger alerts based on sensor thresholds */
export interface AlertTrait {
  condition: string;
  severity?: 'info' | 'warning' | 'critical' | 'emergency';
  visual_effect?: 'flash' | 'pulse' | 'outline' | 'color_change';
  sound?: string;
  haptic?: boolean;
  notification?: boolean;
  cooldown?: number;
}

/** @heatmap_3d - 3D spatial heatmap overlay on physical model */
export interface Heatmap3DTrait {
  data_source: string;
  color_map?: 'viridis' | 'plasma' | 'inferno' | 'magma' | 'turbo' | 'jet' | 'custom';
  opacity?: number;
  resolution?: number;
  interpolation?: 'nearest' | 'linear' | 'cubic';
  range?: { min: number; max: number };
  animated?: boolean;
  legend?: boolean;
}

// ============================================================================
// AUTONOMOUS AGENT TRAITS (Phase 7)
// ============================================================================

/** @behavior_tree - Declarative behavior tree definition */
export interface BehaviorTreeTrait {
  root: BehaviorNodeDef;
  tick_rate?: number;
  debug_visualization?: boolean;
  blackboard?: Record<string, unknown>;
  restart_on_complete?: boolean;
}

export interface BehaviorNodeDef {
  type: 'sequence' | 'selector' | 'parallel' | 'decorator' | 'action' | 'condition';
  name?: string;
  children?: BehaviorNodeDef[];
  action?: string;
  condition?: string;
  decorator?: 'inverter' | 'repeater' | 'retry' | 'timeout' | 'cooldown';
  params?: Record<string, unknown>;
}

/** @goal_oriented - GOAP (Goal-Oriented Action Planning) */
export interface GoalOrientedTrait {
  goals: Array<{ name: string; priority: number; conditions: Record<string, unknown> }>;
  actions: Array<{ name: string; cost: number; preconditions: Record<string, unknown>; effects: Record<string, unknown> }>;
  replan_interval?: number;
  max_plan_depth?: number;
}

/** @llm_agent - LLM-powered decision-making with bounded autonomy */
export interface LLMAgentTrait {
  model?: string;
  system_prompt: string;
  context_window?: number;
  temperature?: number;
  tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>;
  max_actions_per_turn?: number;
  bounded_autonomy?: boolean;
  escalation_conditions?: string[];
}

/** @memory - Persistent agent memory */
export interface MemoryTrait {
  memory_type?: 'episodic' | 'semantic' | 'working' | 'all';
  capacity?: number;
  decay_rate?: number;
  importance_threshold?: number;
  retrieval_mode?: 'recency' | 'relevance' | 'importance' | 'hybrid';
  persist_across_sessions?: boolean;
}

/** @perception - Agent sensory system */
export interface PerceptionTrait {
  sight_range?: number;
  sight_angle?: number;
  hearing_range?: number;
  memory_duration?: number;
  detection_layers?: string[];
  los_check?: boolean;
  peripheral_vision?: boolean;
  alert_radius?: number;
}

/** @emotion - Emotional state model affecting behavior */
export interface EmotionTrait {
  model?: 'basic' | 'pad' | 'occ' | 'plutchik';
  default_mood?: string;
  reactivity?: number;
  decay_rate?: number;
  expression_mapping?: Record<string, string>;
  influence_behavior?: boolean;
  social_contagion?: boolean;
}

/** @dialogue - Branching dialogue system with LLM support */
export interface DialogueTrait {
  dialogue_tree?: Record<string, { text: string; responses?: Array<{ text: string; next: string; condition?: string }> }>;
  llm_dynamic?: boolean;
  personality?: string;
  knowledge_base?: string;
  voice_enabled?: boolean;
  voice_id?: string;
  emotion_aware?: boolean;
}

/** @faction - Faction/relationship system */
export interface FactionTrait {
  faction_id: string;
  reputation?: Record<string, number>;
  hostile_factions?: string[];
  allied_factions?: string[];
  neutral_threshold?: number;
  reputation_decay?: number;
}

/** @patrol - Patrol route/waypoint system */
export interface PatrolTrait {
  waypoints: Vector3[];
  mode?: 'loop' | 'ping_pong' | 'random' | 'once';
  speed?: number;
  wait_time?: number;
  alert_on_detection?: boolean;
  resume_after_alert?: boolean;
  path_smoothing?: boolean;
}

// ============================================================================
// ADVANCED SPATIAL AUDIO TRAITS (Phase 8)
// ============================================================================

/** @ambisonics - Higher-order ambisonic encoding/decoding */
export interface AmbisonicsTrait {
  order?: 1 | 2 | 3 | 4;
  normalization?: 'sn3d' | 'n3d' | 'fuma';
  channel_ordering?: 'acn' | 'fuma' | 'sid';
  decoder?: 'binaural' | 'loudspeaker' | 'virtual';
  source?: string;
}

/** @hrtf - Personalized Head-Related Transfer Function rendering */
export interface HRTFTrait {
  profile?: 'generic' | 'personalized' | 'measured';
  database?: 'cipic' | 'listen' | 'ari' | 'hutubs' | 'sofa' | 'custom';
  custom_sofa_url?: string;
  interpolation?: 'nearest' | 'bilinear' | 'spherical';
  crossfade_time?: number;
}

/** @reverb_zone - Room-specific reverb modeling */
export interface ReverbZoneTrait {
  preset?: 'room' | 'hall' | 'cathedral' | 'cave' | 'outdoor' | 'underwater' | 'bathroom' | 'studio';
  size?: number;
  decay_time?: number;
  damping?: number;
  diffusion?: number;
  pre_delay?: number;
  wet_level?: number;
  dry_level?: number;
  shape?: 'box' | 'sphere';
  priority?: number;
}

/** @audio_occlusion - Sound blocked by physical/virtual objects */
export interface AudioOcclusionTrait {
  mode?: 'raycast' | 'geometry' | 'simplified';
  frequency_dependent?: boolean;
  low_pass_filter?: boolean;
  attenuation_factor?: number;
  transmission_factor?: number;
  update_rate?: number;
}

/** @audio_portal - Sound transmission through openings */
export interface AudioPortalTrait {
  opening_size?: number;
  connected_zones?: [string, string];
  transmission_loss?: number;
  diffraction?: boolean;
  frequency_filtering?: boolean;
}

/** @audio_material - Per-material acoustic properties */
export interface AudioMaterialTrait {
  absorption_coefficients?: Record<string, number>;
  reflection_coefficient?: number;
  transmission_coefficient?: number;
  scattering_coefficient?: number;
  material_preset?: 'concrete' | 'wood' | 'glass' | 'carpet' | 'metal' | 'fabric' | 'tile' | 'custom';
}

/** @head_tracked_audio - Audio anchored to world, not head */
export interface HeadTrackedAudioTrait {
  source: string;
  anchor_mode?: 'world' | 'screen' | 'head_relative';
  tracking_latency_compensation?: boolean;
  stabilization?: number;
  bypass_spatialization?: boolean;
}

// ============================================================================
// OPENUSD & INTEROPERABILITY TRAITS (Phase 9)
// ============================================================================

/** @usd - Import/export OpenUSD scenes */
export interface USDTrait {
  source?: string;
  layer?: string;
  variant_set?: string;
  variant?: string;
  purpose?: 'default' | 'render' | 'proxy' | 'guide';
  time_code?: number;
  payload_loading?: 'eager' | 'lazy';
}

/** @gltf - First-class glTF/glb support with extensions */
export interface GLTFTrait {
  source: string;
  draco_compression?: boolean;
  meshopt_compression?: boolean;
  ktx2_textures?: boolean;
  extensions?: string[];
  animation_clip?: string;
  lod_levels?: number;
}

/** @fbx - FBX format import */
export interface FBXTrait {
  source: string;
  animation_stack?: string;
  embed_textures?: boolean;
  scale_factor?: number;
  up_axis?: 'y' | 'z';
}

/** @material_x - MaterialX material description support */
export interface MaterialXTrait {
  source?: string;
  material_name?: string;
  node_graph?: string;
  color_space?: 'srgb' | 'linear' | 'aces' | 'raw';
  shading_model?: 'standard_surface' | 'open_pbr' | 'gltf_pbr';
}

/** @scene_graph - Explicit scene hierarchy for interchange */
export interface SceneGraphTrait {
  root_node?: string;
  instancing?: boolean;
  merge_strategy?: 'replace' | 'merge' | 'overlay';
  coordinate_system?: 'y_up' | 'z_up';
  unit_scale?: number;
}

// ============================================================================
// CO-PRESENCE & SHARED EXPERIENCE TRAITS (Phase 10)
// ============================================================================

/** @co_located - Shared experience in same physical space */
export interface CoLocatedTrait {
  shared_anchor_id?: string;
  alignment_method?: 'qr_code' | 'image_target' | 'manual' | 'cloud_anchor';
  alignment_timeout?: number;
  visual_indicator?: boolean;
  max_participants?: number;
}

/** @remote_presence - Telepresence with avatar representation */
export interface RemotePresenceTrait {
  avatar_type?: 'full_body' | 'upper_body' | 'head_hands' | 'orb' | 'custom';
  voice_enabled?: boolean;
  video_enabled?: boolean;
  latency_compensation?: boolean;
  quality_adaptive?: boolean;
  bandwidth_limit?: number;
}

/** @shared_world - Synchronized world state across devices */
export interface SharedWorldTrait {
  authority_model?: 'server' | 'host' | 'distributed';
  sync_rate?: number;
  conflict_resolution?: 'server_wins' | 'latest_wins' | 'merge';
  object_ownership?: boolean;
  late_join_sync?: boolean;
  state_persistence?: boolean;
}

/** @voice_proximity - Spatial voice attenuation by distance */
export interface VoiceProximityTrait {
  min_distance?: number;
  max_distance?: number;
  falloff?: 'linear' | 'logarithmic' | 'inverse_square';
  directional?: boolean;
  zones?: Array<{ id: string; position: Vector3; radius: number; mode: 'private' | 'amplified' | 'muted' }>;
}

/** @avatar_embodiment - User body representation */
export interface AvatarEmbodimentTrait {
  tracking_source?: 'headset' | 'full_body' | 'face_hands' | 'external';
  ik_mode?: 'full' | 'upper_body' | 'head_hands';
  mirror_expressions?: boolean;
  lip_sync?: boolean;
  eye_tracking_forward?: boolean;
  personal_space_radius?: number;
}

/** @spectator - View-only participant mode */
export interface SpectatorTrait {
  camera_mode?: 'free' | 'follow' | 'fixed' | 'orbit';
  follow_target?: string;
  can_interact?: boolean;
  visible_to_participants?: boolean;
  max_spectators?: number;
  delay?: number;
}

/** @role - Role-based permissions */
export interface RoleTrait {
  role_id: string;
  permissions?: Array<'interact' | 'modify' | 'create' | 'delete' | 'admin' | 'moderate'>;
  display_badge?: boolean;
  badge_color?: Color;
  inherits_from?: string;
}

// ============================================================================
// GEOSPATIAL & AR CLOUD TRAITS (Phase 11)
// ============================================================================

/** @geospatial_anchor - Lat/lon/alt world anchoring */
export interface GeospatialAnchorTrait {
  latitude: number;
  longitude: number;
  altitude?: number;
  altitude_type?: 'wgs84' | 'terrain' | 'rooftop';
  heading?: number;
  accuracy_threshold?: number;
  visual_indicator?: boolean;
}

/** @terrain_anchor - Ground-relative positioning */
export interface TerrainAnchorTrait {
  latitude: number;
  longitude: number;
  elevation_offset?: number;
  terrain_following?: boolean;
  surface_normal_alignment?: boolean;
}

/** @rooftop_anchor - Building-relative positioning */
export interface RooftopAnchorTrait {
  latitude: number;
  longitude: number;
  elevation_offset?: number;
  building_id?: string;
}

/** @vps - Visual Positioning System integration */
export interface VPSTrait {
  provider?: 'arcore' | 'niantic' | 'azure' | 'custom';
  coverage_check?: boolean;
  localization_timeout?: number;
  continuous_tracking?: boolean;
  quality_threshold?: number;
}

/** @poi - Point of interest with proximity triggers */
export interface POITrait {
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  trigger_radius?: number;
  visible_radius?: number;
  navigation_target?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// WEB3 & OWNERSHIP TRAITS (Phase 12)
// ============================================================================

/** @nft - Link object to blockchain ownership proof */
export interface NFTTrait {
  chain?: 'ethereum' | 'polygon' | 'solana' | 'base' | 'custom';
  contract_address?: string;
  token_id?: string;
  metadata_uri?: string;
  display_ownership?: boolean;
  transfer_enabled?: boolean;
}

/** @token_gated - Access control via token ownership */
export interface TokenGatedTrait {
  chain?: string;
  contract_address: string;
  min_balance?: number;
  token_type?: 'erc721' | 'erc1155' | 'erc20' | 'spl';
  fallback_behavior?: 'hide' | 'blur' | 'lock' | 'redirect';
  gate_message?: string;
}

/** @wallet - Wallet connection and identity */
export interface WalletTrait {
  supported_wallets?: string[];
  auto_connect?: boolean;
  display_address?: boolean;
  display_ens?: boolean;
  sign_message_prompt?: string;
  network?: string;
}

/** @marketplace - In-world marketplace integration */
export interface MarketplaceTrait {
  platform?: 'opensea' | 'rarible' | 'magic_eden' | 'custom';
  listing_enabled?: boolean;
  buy_enabled?: boolean;
  currency?: string;
  royalty_percentage?: number;
  auction_support?: boolean;
}

/** @portable - Asset portability across worlds */
export interface PortableTrait {
  interoperable?: boolean;
  export_formats?: Array<'gltf' | 'usd' | 'vrm'>;
  metadata_standard?: 'erc721_metadata' | 'openusd' | 'custom';
  cross_platform?: boolean;
  version?: string;
}

// ============================================================================
// PHYSICS EXPANSION TRAITS (Phase 13)
// ============================================================================

/** @cloth - Cloth simulation */
export interface ClothTrait {
  resolution?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  gravity_scale?: number;
  wind_response?: number;
  collision_margin?: number;
  self_collision?: boolean;
  tearable?: boolean;
  tear_threshold?: number;
  pin_vertices?: number[];
}

/** @fluid - Fluid dynamics */
export interface FluidTrait {
  method?: 'sph' | 'flip' | 'mls_mpm' | 'eulerian';
  particle_count?: number;
  viscosity?: number;
  surface_tension?: number;
  density?: number;
  gravity?: Vector3;
  bounds?: { min: Vector3; max: Vector3 };
  render_mode?: 'particles' | 'mesh' | 'marching_cubes' | 'screen_space';
  color?: Color;
}

/** @soft_body - Deformable body physics */
export interface SoftBodyTrait {
  stiffness?: number;
  damping?: number;
  mass?: number;
  pressure?: number;
  volume_conservation?: number;
  collision_margin?: number;
  solver_iterations?: number;
  tetrahedral?: boolean;
}

/** @rope - Rope/cable simulation */
export interface RopeTrait {
  length?: number;
  segments?: number;
  stiffness?: number;
  damping?: number;
  radius?: number;
  attach_start?: string;
  attach_end?: string;
  breakable?: boolean;
  break_force?: number;
  gravity_scale?: number;
}

/** @chain - Rigid body chain constraint */
export interface ChainTrait {
  links?: number;
  link_length?: number;
  link_mass?: number;
  stiffness?: number;
  damping?: number;
  attach_start?: string;
  attach_end?: string;
  collision_between_links?: boolean;
}

/** @wind - Wind force field */
export interface WindTrait {
  direction?: Vector3;
  strength?: number;
  turbulence?: number;
  turbulence_frequency?: number;
  pulse?: boolean;
  pulse_frequency?: number;
  falloff?: 'none' | 'linear' | 'quadratic';
  radius?: number;
  affects?: string[];
}

/** @buoyancy - Liquid buoyancy simulation */
export interface BuoyancyTrait {
  fluid_density?: number;
  fluid_level?: number;
  drag?: number;
  angular_drag?: number;
  flow_direction?: Vector3;
  flow_strength?: number;
  splash_effect?: boolean;
  submerge_threshold?: number;
}

/** @destruction - Physics-based destruction */
export interface DestructionTrait {
  mode?: 'voronoi' | 'pre_fractured' | 'runtime' | 'slice';
  fragment_count?: number;
  impact_threshold?: number;
  fragment_lifetime?: number;
  explosion_force?: number;
  chain_reaction?: boolean;
  chain_radius?: number;
  debris_physics?: boolean;
  sound_on_break?: string;
  effect_on_break?: string;
}

export interface ProactiveTrait {
  intelligence_tier?: 'basic' | 'advanced' | 'quantum';
  observation_range?: number;
  learning_rate?: number;
  auto_suggest?: boolean;
  context_window?: number;
}

/**
 * State Management
 */
export interface StateDeclaration {
  [key: string]: unknown;
}

export interface ReactiveState<T extends StateDeclaration> {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  subscribe(callback: (state: T) => void): () => void;
}

/**
 * Lifecycle Hooks
 */
export type LifecycleHook = 'on_mount' | 'on_unmount' | 'on_update' | 'on_data_update';
export type VRLifecycleHook = 'on_grab' | 'on_release' | 'on_hover_enter' | 'on_hover_exit' | 'on_point_enter' | 'on_point_exit' | 'on_collision' | 'on_trigger_enter' | 'on_trigger_exit' | 'on_click' | 'on_double_click';
export type ControllerHook = 'on_controller_button' | 'on_trigger_hold' | 'on_trigger_release' | 'on_grip_hold' | 'on_grip_release';

// Media Production Hooks
export type MediaLifecycleHook = 'on_record_start' | 'on_record_stop' | 'on_record_pause' | 'on_stream_start' | 'on_stream_stop' | 'on_viewer_join' | 'on_viewer_leave' | 'on_chat_message' | 'on_camera_switch' | 'on_video_end' | 'on_video_error';

// Analytics Hooks
export type AnalyticsLifecycleHook = 'on_track_event' | 'on_survey_start' | 'on_survey_complete' | 'on_survey_skip' | 'on_variant_assigned' | 'on_conversion' | 'on_hotspot_detected';

// Social Hooks
export type SocialLifecycleHook = 'on_share' | 'on_share_complete' | 'on_embed' | 'on_scan' | 'on_user_join' | 'on_user_leave' | 'on_draw_stroke' | 'on_object_lock' | 'on_object_unlock';

// Effects Hooks
export type EffectsLifecycleHook = 'on_particle_spawn' | 'on_particle_death' | 'on_transition_start' | 'on_transition_complete' | 'on_filter_change';

// Audio Hooks
export type AudioLifecycleHook = 'on_audio_start' | 'on_audio_end' | 'on_voice_command' | 'on_speech_start' | 'on_speech_end' | 'on_beat' | 'on_frequency_peak';

// AI Hooks
export type AILifecycleHook = 'on_narration_start' | 'on_narration_end' | 'on_user_question' | 'on_response_ready' | 'on_emotion_change' | 'on_generation_complete';

// Timeline Hooks
export type TimelineLifecycleHook = 'on_timeline_start' | 'on_timeline_complete' | 'on_keyframe_hit' | 'on_keyframe_add' | 'on_beat_sync' | 'on_move_complete';

// Environment Understanding Hooks
export type EnvironmentLifecycleHook = 'on_plane_detected' | 'on_plane_lost' | 'on_plane_updated' | 'on_mesh_detected' | 'on_mesh_updated' | 'on_anchor_created' | 'on_anchor_resolved' | 'on_anchor_lost' | 'on_anchor_shared' | 'on_light_estimated' | 'on_occlusion_updated';

// Input Modality Hooks
export type InputModalityLifecycleHook = 'on_gaze_enter' | 'on_gaze_exit' | 'on_gaze_dwell' | 'on_hand_gesture' | 'on_hand_pinch' | 'on_hand_lost' | 'on_body_pose_update' | 'on_face_expression' | 'on_controller_vibrate' | 'on_accessory_input';

// Accessibility Hooks
export type AccessibilityLifecycleHook = 'on_accessibility_announce' | 'on_subtitle_display' | 'on_magnify' | 'on_contrast_change' | 'on_motion_reduce' | 'on_screen_reader_focus' | 'on_sonification_update';

// Gaussian Splatting & Volumetric Hooks
export type VolumetricLifecycleHook = 'on_splat_loaded' | 'on_nerf_ready' | 'on_volume_frame' | 'on_point_cloud_loaded' | 'on_capture_complete';

// WebGPU Compute Hooks
export type ComputeLifecycleHook = 'on_compute_complete' | 'on_buffer_ready' | 'on_gpu_error';

// Digital Twin & IoT Hooks
export type DigitalTwinLifecycleHook = 'on_sensor_update' | 'on_data_change' | 'on_alert_triggered' | 'on_twin_sync' | 'on_heatmap_update';

// Autonomous Agent Hooks
export type AgentLifecycleHook = 'on_goal_completed' | 'on_goal_failed' | 'on_perception_change' | 'on_emotion_shift' | 'on_faction_change' | 'on_patrol_waypoint' | 'on_llm_response' | 'on_memory_recalled' | 'on_dialogue_start' | 'on_dialogue_end';

// Advanced Spatial Audio Hooks
export type SpatialAudioLifecycleHook = 'on_reverb_enter' | 'on_reverb_exit' | 'on_audio_occluded' | 'on_audio_portal_enter';

// OpenUSD & Interoperability Hooks
export type InteropLifecycleHook = 'on_asset_loaded' | 'on_format_converted' | 'on_scene_composed';

// Co-Presence & Shared Experience Hooks
export type CoPresenceLifecycleHook = 'on_co_presence_joined' | 'on_co_presence_left' | 'on_voice_proximity_change' | 'on_role_change' | 'on_spectator_join' | 'on_avatar_sync';

// Geospatial & AR Cloud Hooks
export type GeospatialLifecycleHook = 'on_vps_localized' | 'on_poi_proximity' | 'on_terrain_resolved' | 'on_rooftop_resolved';

// Web3 & Ownership Hooks
export type Web3LifecycleHook = 'on_wallet_connected' | 'on_token_verified' | 'on_nft_transferred' | 'on_purchase_complete' | 'on_asset_ported';

// Physics Expansion Hooks
export type PhysicsExpansionLifecycleHook = 'on_cloth_tear' | 'on_fluid_splash' | 'on_soft_body_deform' | 'on_rope_snap' | 'on_wind_change' | 'on_submerge' | 'on_destruction_complete';

// Combined hook type for all lifecycle hooks
export type AllLifecycleHooks =
  | LifecycleHook
  | VRLifecycleHook
  | ControllerHook
  | MediaLifecycleHook
  | AnalyticsLifecycleHook
  | SocialLifecycleHook
  | EffectsLifecycleHook
  | AudioLifecycleHook
  | AILifecycleHook
  | TimelineLifecycleHook
  | EnvironmentLifecycleHook
  | InputModalityLifecycleHook
  | AccessibilityLifecycleHook
  | VolumetricLifecycleHook
  | ComputeLifecycleHook
  | DigitalTwinLifecycleHook
  | AgentLifecycleHook
  | SpatialAudioLifecycleHook
  | InteropLifecycleHook
  | CoPresenceLifecycleHook
  | GeospatialLifecycleHook
  | Web3LifecycleHook
  | PhysicsExpansionLifecycleHook;

/**
 * AST Node Types
 */
export type HSPlusDirective =
  | { type: 'state'; body: StateDeclaration }
  | { type: 'for'; variable: string; iterable: string; body: HSPlusNode[] }
  | { type: 'forEach'; variable: string; collection: string; body: HSPlusNode[] }
  | { type: 'while'; condition: string; body: HSPlusNode[] }
  | { type: 'if'; condition: string; body: HSPlusNode[]; else?: HSPlusNode[] }
  | { type: 'import'; path: string; alias: string }
  | { type: 'lifecycle'; hook: AllLifecycleHooks; params?: string[]; body: string }
  | { type: 'trait'; name: VRTraitName; config: Record<string, unknown> }
  | { type: 'external_api'; url: string; method?: string; interval?: string }
  | { type: 'generate'; prompt: string; context?: string; target?: string };

export type VRTraitName =
  // Core VR Interaction Traits
  | 'grabbable'
  | 'throwable'
  | 'pointable'
  | 'hoverable'
  | 'scalable'
  | 'rotatable'
  | 'stackable'
  | 'snappable'
  | 'breakable'
  | 'haptic'
  | 'stretchable'
  | 'moldable'
  // Humanoid/Avatar Traits
  | 'skeleton'
  | 'body'
  | 'face'
  | 'expressive'
  | 'hair'
  | 'clothing'
  | 'hands'
  | 'character_voice'
  | 'locomotion'
  | 'poseable'
  | 'morph'
  | 'networked'
  | 'proactive'
  // Media Production Traits
  | 'recordable'
  | 'streamable'
  | 'camera'
  | 'video'
  // Analytics & Research Traits
  | 'trackable'
  | 'survey'
  | 'abtest'
  | 'heatmap'
  // Social & Viral Traits
  | 'shareable'
  | 'embeddable'
  | 'qr'
  | 'collaborative'
  // Effects Traits
  | 'particle'
  | 'transition'
  | 'filter'
  | 'trail'
  // Audio Traits
  | 'spatial_audio'
  | 'voice'
  | 'reactive_audio'
  // AI & Generative Traits
  | 'narrator'
  | 'responsive'
  | 'procedural'
  | 'captioned'
  // Timeline & Choreography Traits
  | 'timeline'
  | 'choreography'
  // Environment Understanding Traits
  | 'plane_detection'
  | 'mesh_detection'
  | 'anchor'
  | 'persistent_anchor'
  | 'shared_anchor'
  | 'geospatial'
  | 'occlusion'
  | 'light_estimation'
  // Input Modality Traits
  | 'eye_tracking'
  | 'hand_tracking'
  | 'controller'
  | 'spatial_accessory'
  | 'body_tracking'
  | 'face_tracking'
  // Accessibility Traits
  | 'accessible'
  | 'alt_text'
  | 'spatial_audio_cue'
  | 'sonification'
  | 'haptic_cue'
  | 'magnifiable'
  | 'high_contrast'
  | 'motion_reduced'
  | 'subtitle'
  | 'screen_reader'
  // Gaussian Splatting & Volumetric Traits
  | 'gaussian_splat'
  | 'nerf'
  | 'volumetric_video'
  | 'point_cloud'
  | 'photogrammetry'
  // WebGPU Compute Traits
  | 'compute'
  | 'gpu_particle'
  | 'gpu_physics'
  | 'gpu_buffer'
  // Digital Twin & IoT Traits
  | 'sensor'
  | 'digital_twin'
  | 'data_binding'
  | 'alert'
  | 'heatmap_3d'
  // Autonomous Agent Traits
  | 'behavior_tree'
  | 'goal_oriented'
  | 'llm_agent'
  | 'memory'
  | 'perception'
  | 'emotion'
  | 'dialogue'
  | 'faction'
  | 'patrol'
  // Advanced Spatial Audio Traits
  | 'ambisonics'
  | 'hrtf'
  | 'reverb_zone'
  | 'audio_occlusion'
  | 'audio_portal'
  | 'audio_material'
  | 'head_tracked_audio'
  // OpenUSD & Interoperability Traits
  | 'usd'
  | 'gltf'
  | 'fbx'
  | 'material_x'
  | 'scene_graph'
  // Co-Presence & Shared Experience Traits
  | 'co_located'
  | 'remote_presence'
  | 'shared_world'
  | 'voice_proximity'
  | 'avatar_embodiment'
  | 'spectator'
  | 'role'
  // Geospatial & AR Cloud Traits
  | 'geospatial_anchor'
  | 'terrain_anchor'
  | 'rooftop_anchor'
  | 'vps'
  | 'poi'
  // Web3 & Ownership Traits
  | 'nft'
  | 'token_gated'
  | 'wallet'
  | 'marketplace'
  | 'portable'
  // Physics Expansion Traits
  | 'cloth'
  | 'fluid'
  | 'soft_body'
  | 'rope'
  | 'chain'
  | 'wind'
  | 'buoyancy'
  | 'destruction';

export interface HSPlusNode {
  type: string;
  id?: string;
  properties: Record<string, unknown>;
  directives: HSPlusDirective[];
  children: HSPlusNode[];
  traits: Map<VRTraitName, unknown>;
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface HSPlusAST {
  version: '1.0';
  root: HSPlusNode;
  imports: Array<{ path: string; alias: string }>;
  hasState: boolean;
  hasVRTraits: boolean;
  hasControlFlow: boolean;
}

/**
 * Runtime Context
 */
export interface HSPlusRuntimeContext {
  data: unknown;
  state: ReactiveState<StateDeclaration>;
  vr: {
    hands: { left: VRHand | null; right: VRHand | null };
    headset: { position: Vector3; rotation: Vector3 };
    controllers: { left: unknown; right: unknown };
  };
  scripts: Record<string, (...args: unknown[]) => unknown>;
  builtins: HSPlusBuiltins;
}

export interface HSPlusBuiltins {
  // Core utilities
  Math: typeof Math;
  range: (start: number, end: number, step?: number) => number[];
  interpolate_color: (t: number, from: Color, to: Color) => Color;
  distance_to: (point: Vector3) => number;
  distance_to_viewer: () => number;

  // VR hand tracking
  hand_position: (handId: string) => Vector3;
  hand_velocity: (handId: string) => Vector3;
  dominant_hand: () => VRHand;

  // Audio & haptics
  play_sound: (source: string, options?: { volume?: number; spatial?: boolean }) => void;
  haptic_feedback: (hand: VRHand | string, intensity: number) => void;
  haptic_pulse: (intensity: number) => void;
  play_spatial_audio?: (sourceId: string) => void;
  stop_spatial_audio?: (sourceId: string) => void;

  // Object manipulation
  apply_velocity: (node: HSPlusNode, velocity: Vector3) => void;
  spawn: (template: string, position: Vector3) => HSPlusNode;
  destroy: (node: HSPlusNode) => void;

  // AI & generation
  assistant_generate: (prompt: string, context?: string) => void;
  generate_response?: (question: string) => Promise<string>;
  speak?: (text: string, options?: { voice?: string; emotion?: string }) => void;

  // API & networking
  api_call: (url: string, method: string, body?: unknown) => Promise<unknown>;

  // UI
  open_modal: (modalId: string) => void;
  close_modal: (modalId: string) => void;
  show_toast?: (message: string, options?: { duration?: number; type?: string }) => void;

  // Timers
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (id: number) => void;
  animate: (node: HSPlusNode, properties: Record<string, unknown>, options?: { duration?: number; sync?: boolean }) => void;
  transition: (targetScene: string, options?: { audio?: string; effect?: string }) => void;
  // === Media Production Builtins (Optional - Researcher/Viralist features) ===
  start_recording?: (options?: { format?: string; quality?: string }) => void;
  stop_recording?: () => RecordingClip;
  pause_recording?: () => void;
  resume_recording?: () => void;
  capture_screenshot?: (options?: { format?: string; resolution?: Vector2 }) => string;
  start_streaming?: (platform: string) => void;
  stop_streaming?: () => void;
  toggle_recording?: () => void;
  stop_all_recordings?: () => void;

  // === Analytics Builtins (Optional - Researcher/Viralist features) ===
  track_event?: (eventName: string, properties?: Record<string, unknown>) => void;
  track_conversion?: (experimentId: string, value?: number) => void;
  initialize_analytics?: (projectId: string) => void;
  flush_analytics?: () => void;
  sync_analytics?: () => void;
  start_heatmap_tracking?: () => void;
  stop_heatmap_tracking?: () => void;
  update_engagement_score?: () => void;

  // === Social Builtins (Optional - Researcher/Viralist features) ===
  share_to_platform?: (platform: string, content?: ShareContent) => Promise<ShareResult>;
  generate_qr?: (data: string) => string;
  send_notification?: (target: unknown, message: string) => void;
  unlock_feature?: (featureId: string) => void;

  // === Effects Builtins (Optional - Researcher/Viralist features) ===
  emit_particles?: (type: string | ParticleConfig, position: Vector3) => void;
  start_particles?: () => void;
  stop_particles?: () => void;
  start_transition?: (from: string, to: string) => void;
  apply_filter?: (filterType: string, intensity?: number) => void;
  remove_filter?: () => void;
  cycle_filter?: () => void;
  trigger_random_effect?: () => void;

  // === Timeline Builtins (Optional - Researcher/Viralist features) ===
  play_timeline?: (timelineId: string) => void;
  pause_timeline?: (timelineId: string) => void;
  seek_timeline?: (timelineId: string, time: number) => void;
  toggle_timeline_playback?: () => void;
  toggle_playback?: () => void;

  // === Collaboration Builtins (Optional - Researcher/Viralist features) ===
  save_collaboration_state?: () => void;
  broadcast_to_collaborators?: (event: string, data: unknown) => void;

  // === Navigation Builtins (Optional - Researcher/Viralist features) ===
  teleport_to?: (zoneId: string) => void;
}

// Supporting types for builtins
export interface RecordingClip {
  id: string;
  duration: number;
  format: string;
  url: string;
  thumbnail?: string;
}

export interface ShareContent {
  title?: string;
  description?: string;
  url?: string;
  media?: string;
}

export interface ShareResult {
  success: boolean;
  platform: string;
  shareUrl?: string;
  error?: string;
}

export interface ParticleConfig {
  type: string;
  rate?: number;
  color?: Color | Color[];
  size?: number;
  lifetime?: number;
}

export interface HSPlusParserOptions {
  enableVRTraits?: boolean;
  enableTypeScriptImports?: boolean;
  strict?: boolean;
  sourcePath?: string;
}

export interface HSPlusCompileResult {
  ast: HSPlusAST;
  compiledExpressions: Map<string, string>;
  requiredCompanions: string[];
  features: {
    state: boolean;
    vrTraits: boolean;
    loops: boolean;
    conditionals: boolean;
    lifecycleHooks: boolean;
  };
  warnings: Array<{ message: string; line: number; column: number }>;
  errors: Array<{ message: string; line: number; column: number }>;
}

export interface HSPlusRuntime {
  mount: (container: unknown) => void;
  unmount: () => void;
  updateData: (data: unknown) => void;
  getState: () => StateDeclaration;
  setState: (updates: Partial<StateDeclaration>) => void;
  emit: (event: string, payload?: unknown) => void;
  updateEntity: (id: string, properties: Partial<Record<string, unknown>>) => boolean;
  on: (event: string, handler: (payload: unknown) => void) => () => void;
}

// Type aliases for *TraitConfig → *Trait naming consistency
export type GeospatialTrait = GeospatialTraitConfig;
export type OcclusionTrait = OcclusionTraitConfig;
export type ControllerTrait = ControllerTraitConfig;
export type FaceTrackingTrait = FaceTrackingTraitConfig;

/** @haptic - Haptic feedback configuration */
export interface HapticTrait {
  intensity?: number;
  duration?: number;
  pattern?: 'pulse' | 'rumble' | 'buzz' | 'click';
  frequency?: number;
  trigger?: 'on_grab' | 'on_hover' | 'on_collision' | 'on_click';
  both_hands?: boolean;
}
