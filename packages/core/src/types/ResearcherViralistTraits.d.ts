/**
 * HoloScript+ Researcher & Viralist Traits
 *
 * Extended trait system for content creators, researchers, and viral content production.
 * These traits enable recording, analytics, social sharing, effects, and AI-powered features.
 *
 * @version 2.0.0
 * @license MIT
 */

import type { Vector3, Vector2, Color, Duration } from './HoloScriptPlus.js';

// =============================================================================
// MEDIA PRODUCTION TRAITS
// =============================================================================

/**
 * @recordable - Capture scene/viewport for viral clips
 */
export interface RecordableTrait {
  /** Capture mode - 360 panoramic, viewport only, or fixed camera angle */
  capture_mode?: '360' | 'viewport' | 'fixed_camera' | 'follow_target';

  /** Output resolution */
  resolution?: Vector2;

  /** Frames per second */
  fps?: 30 | 60 | 120;

  /** Output format */
  format?: 'mp4' | 'webm' | 'gif' | 'png_sequence';

  /** Maximum recording duration */
  max_duration?: Duration;

  /** Include audio in recording */
  include_audio?: boolean;

  /** Auto-start recording on scene load */
  auto_record?: boolean;

  /** Hotkey to toggle recording */
  hotkey?: string;

  /** Watermark configuration */
  watermark?: {
    image?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity?: number;
  };

  /** Quality preset */
  quality?: 'low' | 'medium' | 'high' | 'ultra';

  /** Enable highlight detection for auto-clipping */
  highlight_detection?: boolean;
}

/**
 * @streamable - Live streaming to platforms
 */
export interface StreamableTrait {
  /** Target platform */
  platform?: 'twitch' | 'youtube' | 'kick' | 'custom';

  /** Custom RTMP URL for streaming */
  rtmp_url?: string;

  /** Stream key (should be env variable reference) */
  stream_key_env?: string;

  /** Bitrate in kbps */
  bitrate?: number;

  /** Resolution */
  resolution?: Vector2;

  /** Enable chat overlay */
  chat_overlay?: boolean;

  /** Viewer count display */
  show_viewer_count?: boolean;

  /** Auto-start streaming */
  auto_start?: boolean;

  /** Low latency mode */
  low_latency?: boolean;
}

/**
 * @camera - Virtual camera control for cinematic shots
 */
export interface CameraTrait {
  /** Camera movement mode */
  mode?: 'static' | 'orbit' | 'dolly' | 'crane' | 'handheld' | 'follow' | 'first_person';

  /** Target object to follow/orbit */
  target?: string;

  /** Orbit distance from target */
  orbit_distance?: number;

  /** Auto-rotate around target */
  auto_rotate?: boolean;

  /** Rotation speed (degrees per second) */
  rotation_speed?: number;

  /** Smooth follow interpolation */
  smooth_follow?: boolean;

  /** Follow smoothness (0-1) */
  follow_smoothness?: number;

  /** Camera shake intensity */
  shake_intensity?: number;

  /** Shake frequency */
  shake_frequency?: number;

  /** Field of view */
  fov?: number;

  /** Depth of field settings */
  depth_of_field?: {
    enabled?: boolean;
    focus_distance?: number;
    aperture?: number;
    blur_intensity?: number;
  };

  /** Cinematic bars (letterbox) */
  letterbox?: boolean;

  /** Letterbox ratio */
  aspect_ratio?: '16:9' | '21:9' | '2.35:1' | 'custom';

  /** Path following */
  path?: Vector3[];

  /** Path animation duration */
  path_duration?: Duration;

  /** Path easing */
  path_easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

/**
 * @video - Video playback in scene
 */
export interface VideoTrait {
  /** Video source URL */
  source: string;

  /** Auto-play on load */
  autoplay?: boolean;

  /** Loop video */
  loop?: boolean;

  /** Muted by default */
  muted?: boolean;

  /** Volume (0-1) */
  volume?: number;

  /** Spatial audio for video */
  spatial?: boolean;

  /** Playback controls visible */
  controls?: boolean;

  /** Projection type */
  projection?: 'flat' | '360' | '180' | 'dome';

  /** Chroma key (green screen) */
  chroma_key?: {
    enabled?: boolean;
    color?: Color;
    threshold?: number;
  };
}

// =============================================================================
// ANALYTICS & RESEARCH TRAITS
// =============================================================================

/**
 * @trackable - User engagement tracking
 */
export interface TrackableTrait {
  /** Events to track */
  track_events?: Array<'grab' | 'look' | 'interact' | 'hover' | 'click' | 'proximity' | 'time_spent'>;

  /** Enable heatmap generation */
  heatmap?: boolean;

  /** Heatmap resolution */
  heatmap_resolution?: 'low' | 'medium' | 'high';

  /** Session recording */
  session_recording?: boolean;

  /** Track gaze/eye direction */
  gaze_tracking?: boolean;

  /** Minimum dwell time to count as engagement (ms) */
  dwell_threshold?: number;

  /** Export format for analytics data */
  export_format?: 'json' | 'csv' | 'parquet';

  /** Real-time analytics endpoint */
  realtime_endpoint?: string;

  /** Batch analytics endpoint */
  batch_endpoint?: string;

  /** Anonymous tracking (no user IDs) */
  anonymous?: boolean;

  /** GDPR compliance mode */
  gdpr_compliant?: boolean;

  /** Custom event properties */
  custom_properties?: Record<string, unknown>;
}

/**
 * @survey - In-VR research surveys
 */
export interface SurveyTrait {
  /** Survey questions */
  questions: SurveyQuestion[];

  /** When to trigger survey */
  trigger?: 'on_enter' | 'on_exit' | 'after_task' | 'timed' | 'manual';

  /** Delay before showing (for timed trigger) */
  delay?: Duration;

  /** Survey title */
  title?: string;

  /** Survey description */
  description?: string;

  /** Submit endpoint */
  submit_endpoint?: string;

  /** Allow skip */
  skippable?: boolean;

  /** Show progress indicator */
  show_progress?: boolean;

  /** Randomize question order */
  randomize?: boolean;

  /** Thank you message after completion */
  thank_you_message?: string;

  /** Reward for completion */
  completion_reward?: {
    type?: 'badge' | 'item' | 'points';
    value?: string | number;
  };
}

export interface SurveyQuestion {
  /** Question type */
  type: 'rating' | 'choice' | 'multi_choice' | 'open' | 'slider' | 'likert' | 'nps';

  /** Question text */
  text: string;

  /** Question ID for data export */
  id?: string;

  /** Required question */
  required?: boolean;

  /** Options for choice questions */
  options?: string[];

  /** Scale for rating/slider questions */
  scale?: number;

  /** Min/max labels for scales */
  scale_labels?: { min?: string; max?: string };

  /** Conditional display based on previous answer */
  show_if?: { question_id: string; answer: string | number };
}

/**
 * @abtest - A/B testing framework
 */
export interface ABTestTrait {
  /** Test name/ID */
  test_id: string;

  /** Variant configurations */
  variants: Record<string, Record<string, unknown>>;

  /** Traffic split percentages */
  split?: Record<string, number>;

  /** Metric to track for success */
  track_metric?: 'engagement_time' | 'conversion' | 'completion' | 'custom';

  /** Custom metric name */
  custom_metric?: string;

  /** Minimum sample size before concluding */
  min_sample_size?: number;

  /** Statistical significance threshold */
  significance_threshold?: number;

  /** Sticky assignment (same user always sees same variant) */
  sticky?: boolean;

  /** Analytics endpoint */
  analytics_endpoint?: string;
}

/**
 * @heatmap - Spatial engagement heatmap
 */
export interface HeatmapTrait {
  /** Heatmap type */
  type?: 'position' | 'gaze' | 'interaction' | 'time_spent';

  /** Resolution of the heatmap grid */
  resolution?: number;

  /** Color gradient */
  colors?: Color[];

  /** Opacity */
  opacity?: number;

  /** Real-time visualization */
  realtime?: boolean;

  /** Export heatmap data */
  export?: boolean;

  /** 3D volumetric heatmap */
  volumetric?: boolean;

  /** Decay rate for time-based heatmaps */
  decay_rate?: number;
}

// =============================================================================
// SOCIAL & VIRAL TRAITS
// =============================================================================

/**
 * @shareable - Social sharing capabilities
 */
export interface ShareableTrait {
  /** Target platforms */
  platforms?: Array<'twitter' | 'tiktok' | 'instagram' | 'discord' | 'facebook' | 'linkedin' | 'reddit' | 'clipboard'>;

  /** Auto-generate clip on share */
  auto_clip?: {
    enabled?: boolean;
    duration?: number;
    trigger?: 'highlight' | 'manual' | 'interval';
  };

  /** Watermark on shared content */
  watermark?: string;

  /** Caption template (supports variables) */
  caption_template?: string;

  /** Hashtags to include */
  hashtags?: string[];

  /** Share button visibility */
  share_button?: {
    visible?: boolean;
    position?: Vector3;
    style?: 'minimal' | 'full' | 'floating';
  };

  /** Track shares */
  track_shares?: boolean;

  /** Referral tracking */
  referral_tracking?: boolean;
}

/**
 * @embeddable - Generate embed codes
 */
export interface EmbeddableTrait {
  /** Allow iframe embedding */
  iframe_allowed?: boolean;

  /** Minimum embed width */
  min_width?: number;

  /** Minimum embed height */
  min_height?: number;

  /** Responsive sizing */
  responsive?: boolean;

  /** Allowed domains for embedding */
  allowed_domains?: string[];

  /** Controls to show in embed */
  controls?: Array<'fullscreen' | 'vr_toggle' | 'mute' | 'share'>;

  /** Auto-play in embed */
  autoplay?: boolean;

  /** Show branding */
  show_branding?: boolean;
}

/**
 * @qr - Generate QR codes
 */
export interface QRTrait {
  /** Content for QR code (URL, text, etc.) */
  content: string;

  /** QR code size in world units */
  size?: number;

  /** Error correction level */
  error_correction?: 'L' | 'M' | 'Q' | 'H';

  /** Foreground color */
  foreground_color?: Color;

  /** Background color */
  background_color?: Color;

  /** Include logo in center */
  logo?: string;

  /** Dynamic content (updates on state change) */
  dynamic?: boolean;

  /** Track scans */
  track_scans?: boolean;
}

/**
 * @collaborative - Real-time co-editing
 */
export interface CollaborativeTrait {
  /** Maximum simultaneous editors */
  max_editors?: number;

  /** Permission model */
  permission_model?: 'owner' | 'open' | 'invite' | 'role_based';

  /** Sync mode */
  sync_mode?: 'realtime' | 'turn_based' | 'async';

  /** Show other users' cursors */
  show_cursors?: boolean;

  /** Cursor colors for different users */
  cursor_colors?: Color[];

  /** Voice chat for collaborators */
  voice_chat?: boolean;

  /** Text chat */
  text_chat?: boolean;

  /** Conflict resolution strategy */
  conflict_resolution?: 'last_write_wins' | 'merge' | 'manual';

  /** Version history */
  version_history?: boolean;

  /** Undo/redo sync */
  sync_undo?: boolean;
}

// =============================================================================
// EFFECTS & POLISH TRAITS
// =============================================================================

/**
 * @particle - Particle system
 */
export interface ParticleTrait {
  /** Particle emission type */
  type?: 'burst' | 'continuous' | 'trail';

  /** Emitter shape */
  shape?: 'point' | 'sphere' | 'box' | 'cone' | 'circle' | 'edge' | 'mesh';

  /** Emission rate (particles per second) */
  rate?: number;

  /** Burst count (for burst type) */
  burst_count?: number;

  /** Particle lifetime */
  lifetime?: Duration;

  /** Lifetime randomness (0-1) */
  lifetime_randomness?: number;

  /** Start size */
  start_size?: number;

  /** End size */
  end_size?: number;

  /** Size randomness */
  size_randomness?: number;

  /** Start color */
  start_color?: Color;

  /** End color */
  end_color?: Color;

  /** Color over lifetime gradient */
  color_over_lifetime?: Color[];

  /** Start velocity */
  velocity?: Vector3;

  /** Velocity randomness */
  velocity_randomness?: number;

  /** Gravity effect */
  gravity?: number;

  /** Particle texture/sprite */
  texture?: string;

  /** Blend mode */
  blend_mode?: 'additive' | 'alpha' | 'multiply';

  /** Max particles */
  max_particles?: number;

  /** Collision with scene */
  collision?: boolean;

  /** Inherit velocity from parent */
  inherit_velocity?: boolean;

  /** World or local space */
  simulation_space?: 'world' | 'local';
}

/**
 * @transition - Scene/object transitions
 */
export interface TransitionTrait {
  /** Enter transition effect */
  enter?: 'fade' | 'zoom' | 'portal' | 'dissolve' | 'slide' | 'flip' | 'morph' | 'glitch';

  /** Exit transition effect */
  exit?: 'fade' | 'shrink' | 'portal' | 'dissolve' | 'slide' | 'flip' | 'explode';

  /** Transition duration */
  duration?: Duration;

  /** Transition easing */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';

  /** Delay before transition */
  delay?: Duration;

  /** Transition direction (for slide) */
  direction?: 'up' | 'down' | 'left' | 'right';

  /** Portal color (for portal transition) */
  portal_color?: Color;

  /** Stagger children transitions */
  stagger?: Duration;

  /** Stagger order */
  stagger_order?: 'forward' | 'reverse' | 'random';
}

/**
 * @filter - Post-processing effects
 */
export interface FilterTrait {
  /** Bloom effect */
  bloom?: {
    enabled?: boolean;
    intensity?: number;
    threshold?: number;
    radius?: number;
  };

  /** Vignette effect */
  vignette?: {
    enabled?: boolean;
    intensity?: number;
    smoothness?: number;
  };

  /** Color grading preset */
  color_grading?: 'none' | 'cinematic' | 'vibrant' | 'noir' | 'vintage' | 'cyberpunk' | 'warm' | 'cool';

  /** Custom LUT texture */
  lut?: string;

  /** Chromatic aberration */
  chromatic_aberration?: {
    enabled?: boolean;
    intensity?: number;
  };

  /** Film grain */
  grain?: {
    enabled?: boolean;
    intensity?: number;
    size?: number;
  };

  /** Motion blur */
  motion_blur?: {
    enabled?: boolean;
    intensity?: number;
    samples?: number;
  };

  /** Ambient occlusion */
  ambient_occlusion?: {
    enabled?: boolean;
    intensity?: number;
    radius?: number;
  };

  /** Pixelation */
  pixelate?: {
    enabled?: boolean;
    size?: number;
  };

  /** Custom shader */
  custom_shader?: string;
}

/**
 * @trail - Motion trail effect
 */
export interface TrailTrait {
  /** Trail length (number of points) */
  length?: number;

  /** Trail width */
  width?: number;

  /** Width curve over length */
  width_curve?: number[];

  /** Trail color */
  color?: Color;

  /** Color gradient over length */
  color_gradient?: Color[];

  /** Trail fade */
  fade?: boolean;

  /** Fade curve */
  fade_curve?: number[];

  /** Emit when moving threshold */
  emit_threshold?: number;

  /** Trail texture */
  texture?: string;

  /** Minimum vertex distance */
  min_vertex_distance?: number;

  /** Auto-destruct when stopped */
  auto_destruct?: boolean;
}

// =============================================================================
// AUDIO TRAITS
// =============================================================================

/**
 * @spatial_audio - 3D positional audio
 */
export interface SpatialAudioTrait {
  /** Audio source URL */
  source: string;

  /** Volume (0-1) */
  volume?: number;

  /** Pitch */
  pitch?: number;

  /** Loop audio */
  loop?: boolean;

  /** Spatial blend (0 = 2D, 1 = 3D) */
  spatial_blend?: number;

  /** Distance falloff type */
  falloff?: 'linear' | 'logarithmic' | 'custom';

  /** Minimum distance for falloff */
  min_distance?: number;

  /** Maximum distance for falloff */
  max_distance?: number;

  /** Reverb zone */
  reverb?: {
    enabled?: boolean;
    preset?: 'room' | 'hall' | 'cave' | 'outdoor' | 'underwater';
    wet_level?: number;
  };

  /** Doppler effect */
  doppler?: number;

  /** Spread angle (degrees) */
  spread?: number;

  /** Occlusion (sound blocked by objects) */
  occlusion?: boolean;
}

/**
 * @voice - Voice chat
 */
export interface VoiceTrait {
  /** Voice chat mode */
  mode?: 'proximity' | 'global' | 'channel' | 'team';

  /** Spatial voice positioning */
  spatial?: boolean;

  /** Push-to-talk */
  push_to_talk?: boolean;

  /** Push-to-talk key */
  ptt_key?: string;

  /** Voice activation threshold */
  activation_threshold?: number;

  /** Echo cancellation */
  echo_cancellation?: boolean;

  /** Noise suppression */
  noise_suppression?: boolean;

  /** Auto gain control */
  auto_gain?: boolean;

  /** Channel name (for channel mode) */
  channel?: string;

  /** Maximum distance for proximity mode */
  proximity_distance?: number;

  /** Voice indicator visible */
  show_indicator?: boolean;
}

/**
 * @reactive_audio - Audio-reactive visuals
 */
export interface ReactiveAudioTrait {
  /** Audio source */
  source?: 'microphone' | 'audio_element' | 'system' | 'custom';

  /** Audio element ID (for audio_element source) */
  audio_element?: string;

  /** Number of frequency bands to analyze */
  frequency_bands?: number;

  /** FFT size */
  fft_size?: 256 | 512 | 1024 | 2048 | 4096;

  /** Smoothing time constant */
  smoothing?: number;

  /** Beat detection */
  beat_detection?: boolean;

  /** Beat threshold */
  beat_threshold?: number;

  /** Min decibels */
  min_decibels?: number;

  /** Max decibels */
  max_decibels?: number;

  /** Frequency range to analyze */
  frequency_range?: { min?: number; max?: number };
}

// =============================================================================
// AI & GENERATIVE TRAITS
// =============================================================================

/**
 * @narrator - AI narration
 */
export interface NarratorTrait {
  /** Voice preset */
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'custom';

  /** Custom voice ID */
  custom_voice_id?: string;

  /** Narration script */
  script?: string;

  /** Dynamic script (generated from context) */
  dynamic_script?: boolean;

  /** Script generation prompt */
  script_prompt?: string;

  /** Trigger condition */
  trigger?: 'on_enter' | 'on_approach' | 'on_interact' | 'on_event' | 'manual';

  /** Trigger distance (for on_approach) */
  trigger_distance?: number;

  /** Subtitles display */
  subtitles?: boolean;

  /** Subtitle style */
  subtitle_style?: {
    position?: 'top' | 'bottom' | 'floating';
    font_size?: number;
    background?: boolean;
  };

  /** Speed */
  speed?: number;

  /** Language */
  language?: string;

  /** Queue multiple narrations */
  queue?: boolean;

  /** Interruptible */
  interruptible?: boolean;
}

/**
 * @responsive - AI conversational responses
 */
export interface ResponsiveTrait {
  /** AI personality description */
  personality?: string;

  /** System prompt */
  system_prompt?: string;

  /** Knowledge base reference */
  knowledge_base?: string;

  /** Model to use */
  model?: 'gpt-4' | 'claude' | 'gemini' | 'local' | 'custom';

  /** Custom model endpoint */
  custom_endpoint?: string;

  /** Voice enabled for responses */
  voice_enabled?: boolean;

  /** Voice preset */
  voice?: string;

  /** Listen for voice input */
  voice_input?: boolean;

  /** Max response tokens */
  max_tokens?: number;

  /** Temperature */
  temperature?: number;

  /** Context window (conversation history) */
  context_messages?: number;

  /** Response format */
  response_format?: 'text' | 'json' | 'action';

  /** Available actions the AI can trigger */
  available_actions?: string[];

  /** Fallback response */
  fallback?: string;
}

/**
 * @procedural - Procedural generation
 */
export interface ProceduralTrait {
  /** Generation algorithm */
  algorithm?: 'perlin' | 'simplex' | 'voronoi' | 'wave_function_collapse' | 'l_system' | 'custom';

  /** Random seed */
  seed?: number;

  /** Generation parameters */
  params?: Record<string, number>;

  /** Regeneration trigger */
  regenerate_on?: 'click' | 'timer' | 'state_change' | 'manual';

  /** Timer interval for regeneration */
  regenerate_interval?: Duration;

  /** Animate generation */
  animate?: boolean;

  /** Animation duration */
  animation_duration?: Duration;

  /** LOD (level of detail) */
  lod?: number;

  /** Bounds for generation */
  bounds?: { min: Vector3; max: Vector3 };

  /** Tile seamlessly */
  tileable?: boolean;
}

/**
 * @captioned - Auto-captions for media
 */
export interface CaptionedTrait {
  /** Caption source */
  source?: 'auto' | 'file' | 'api';

  /** Caption file URL (for file source) */
  caption_file?: string;

  /** Language */
  language?: string;

  /** Auto-translate to other languages */
  translate?: string[];

  /** Caption style */
  style?: {
    position?: 'top' | 'bottom' | 'auto';
    font_size?: 'small' | 'medium' | 'large';
    background?: boolean;
    background_color?: Color;
    text_color?: Color;
  };

  /** Word-by-word highlighting */
  highlight_words?: boolean;

  /** Speaker identification */
  speaker_labels?: boolean;

  /** Profanity filter */
  profanity_filter?: boolean;
}

// =============================================================================
// TIMELINE & SEQUENCING TRAITS
// =============================================================================

/**
 * @timeline - Animation timeline
 */
export interface TimelineTrait {
  /** Total duration */
  duration: Duration;

  /** Loop timeline */
  loop?: boolean;

  /** Loop count (0 = infinite) */
  loop_count?: number;

  /** Playback speed */
  speed?: number;

  /** Auto-play */
  autoplay?: boolean;

  /** Delay before starting */
  delay?: Duration;

  /** Pause on hover */
  pause_on_hover?: boolean;

  /** Allow seeking */
  seekable?: boolean;

  /** Show playback controls */
  controls?: boolean;

  /** Trigger condition to start */
  trigger?: 'immediate' | 'on_enter' | 'on_interact' | 'manual';
}

/**
 * Keyframe definition for timeline
 */
export interface KeyframeDef {
  /** Time offset */
  time: Duration;

  /** Properties to animate */
  properties: Record<string, unknown>;

  /** Easing for this keyframe */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic' | 'spring';

  /** Callback at this keyframe */
  callback?: string;
}

/**
 * @choreography - Sequenced multi-object animations
 */
export interface ChoreographyTrait {
  /** Objects to choreograph */
  objects: string[];

  /** Sequence of actions */
  sequence: ChoreographyStep[];

  /** Sync to audio track */
  sync_to?: string;

  /** BPM for music sync */
  bpm?: number;

  /** Loop choreography */
  loop?: boolean;

  /** Formation presets */
  formation?: 'line' | 'circle' | 'grid' | 'v_shape' | 'custom';

  /** Formation spacing */
  spacing?: number;
}

export interface ChoreographyStep {
  /** Time offset */
  time: Duration;

  /** Action to perform */
  action: string;

  /** Action parameters */
  params?: Record<string, unknown>;

  /** Which objects (indices or 'all') */
  targets?: number[] | 'all';

  /** Stagger delay between objects */
  stagger?: Duration;
}

// =============================================================================
// EXTENDED LIFECYCLE HOOKS
// =============================================================================

/**
 * New lifecycle hooks for researcher/viralist features
 */
export type MediaLifecycleHook =
  | 'on_record_start'
  | 'on_record_stop'
  | 'on_stream_start'
  | 'on_stream_stop'
  | 'on_viewer_join'
  | 'on_viewer_leave';

export type AnalyticsLifecycleHook =
  | 'on_interaction'
  | 'on_survey_complete'
  | 'on_survey_skip'
  | 'on_variant_assigned'
  | 'on_session_end';

export type SocialLifecycleHook =
  | 'on_share'
  | 'on_share_complete'
  | 'on_embed'
  | 'on_qr_scan'
  | 'on_collaborator_join'
  | 'on_collaborator_leave'
  | 'on_edit';

export type EffectsLifecycleHook =
  | 'on_particle_emit'
  | 'on_transition_start'
  | 'on_transition_complete';

export type AudioLifecycleHook =
  | 'on_audio_start'
  | 'on_audio_end'
  | 'on_beat'
  | 'on_frequency'
  | 'on_speak_start'
  | 'on_speak_end';

export type AILifecycleHook =
  | 'on_narration_start'
  | 'on_narration_end'
  | 'on_ai_response'
  | 'on_caption'
  | 'on_generate_complete';

export type TimelineLifecycleHook =
  | 'on_timeline_start'
  | 'on_timeline_end'
  | 'on_keyframe'
  | 'on_loop';

export type ExtendedLifecycleHook =
  | MediaLifecycleHook
  | AnalyticsLifecycleHook
  | SocialLifecycleHook
  | EffectsLifecycleHook
  | AudioLifecycleHook
  | AILifecycleHook
  | TimelineLifecycleHook;

// =============================================================================
// EXTENDED TRAIT NAMES
// =============================================================================

export type MediaTraitName = 'recordable' | 'streamable' | 'camera' | 'video';
export type AnalyticsTraitName = 'trackable' | 'survey' | 'abtest' | 'heatmap';
export type SocialTraitName = 'shareable' | 'embeddable' | 'qr' | 'collaborative';
export type EffectsTraitName = 'particle' | 'transition' | 'filter' | 'trail';
export type AudioTraitName = 'spatial_audio' | 'voice' | 'reactive_audio';
export type AITraitName = 'narrator' | 'responsive' | 'procedural' | 'captioned';
export type TimelineTraitName = 'timeline' | 'choreography';

export type ResearcherViralistTraitName =
  | MediaTraitName
  | AnalyticsTraitName
  | SocialTraitName
  | EffectsTraitName
  | AudioTraitName
  | AITraitName
  | TimelineTraitName;

// =============================================================================
// EXTENDED BUILTINS
// =============================================================================

export interface ExtendedBuiltins {
  // Recording
  start_recording: () => void;
  stop_recording: () => Promise<Blob>;
  take_screenshot: () => Promise<Blob>;

  // Streaming
  start_stream: () => void;
  stop_stream: () => void;
  get_viewer_count: () => number;

  // Analytics
  track_event: (event: string, properties?: Record<string, unknown>) => void;
  get_heatmap: () => unknown;
  export_analytics: (data: unknown) => void;
  get_watch_time: () => number;

  // Social
  share_to_platform: (platform: string, content?: string) => void;
  generate_embed_code: () => string;
  generate_qr: (content: string) => string;

  // Particles
  emit_particles: (count?: number) => void;
  stop_particles: () => void;
  spawn_confetti: () => void;

  // Audio
  play_audio: (source: string, options?: { volume?: number; spatial?: boolean }) => void;
  stop_audio: (source?: string) => void;
  get_audio_data: () => Float32Array;
  get_beat: () => boolean;

  // AI
  ai_speak: (text: string) => void;
  ai_respond: (input: string) => Promise<string>;
  generate_content: (prompt: string) => Promise<unknown>;

  // Timeline
  play_timeline: () => void;
  pause_timeline: () => void;
  seek_timeline: (time: number) => void;
  get_timeline_progress: () => number;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type AllTraitConfig =
  // Media
  | RecordableTrait
  | StreamableTrait
  | CameraTrait
  | VideoTrait
  // Analytics
  | TrackableTrait
  | SurveyTrait
  | ABTestTrait
  | HeatmapTrait
  // Social
  | ShareableTrait
  | EmbeddableTrait
  | QRTrait
  | CollaborativeTrait
  // Effects
  | ParticleTrait
  | TransitionTrait
  | FilterTrait
  | TrailTrait
  // Audio
  | SpatialAudioTrait
  | VoiceTrait
  | ReactiveAudioTrait
  // AI
  | NarratorTrait
  | ResponsiveTrait
  | ProceduralTrait
  | CaptionedTrait
  // Timeline
  | TimelineTrait
  | ChoreographyTrait;
