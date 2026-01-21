// Shared Constants for HoloScript Core
// Used by Parser, Runtime, and Language Server

export const VR_TRAITS = [
  // Core VR Interaction Traits
  'grabbable',
  'throwable',
  'pointable',
  'hoverable',
  'scalable',
  'rotatable',
  'stackable',
  'snappable',
  'breakable',
  'stretchable',
  'moldable',

  // Humanoid/Avatar Traits
  'skeleton',
  'body',
  'face',
  'expressive',
  'hair',
  'clothing',
  'hands',
  'character_voice',
  'locomotion',
  'poseable',
  'morph',

  // Networking & AI
  'networked',
  'proactive',

  // Media Production Traits
  'recordable',
  'streamable',
  'camera',
  'video',

  // Analytics & Research Traits
  'trackable',
  'survey',
  'abtest',
  'heatmap',

  // Social & Viral Traits
  'shareable',
  'embeddable',
  'qr',
  'collaborative',

  // Effects Traits
  'particle',
  'transition',
  'filter',
  'trail',

  // Audio Traits
  'spatial_audio',
  'voice',
  'reactive_audio',

  // AI & Generative Traits
  'narrator',
  'responsive',
  'procedural',
  'captioned',

  // Timeline & Choreography Traits
  'timeline',
  'choreography',
] as const;

export type VRTraitName = typeof VR_TRAITS[number];

export const LIFECYCLE_HOOKS = [
  // Standard lifecycle
  'on_mount',
  'on_unmount',
  'on_update',
  'on_data_update',

  // VR lifecycle
  'on_grab',
  'on_release',
  'on_hover_enter',
  'on_hover_exit',
  'on_point_enter',
  'on_point_exit',
  'on_collision',
  'on_trigger_enter',
  'on_trigger_exit',
  'on_click',
  'on_double_click',

  // Controller hooks
  'on_controller_button',
  'on_trigger_hold',
  'on_trigger_release',
  'on_grip_hold',
  'on_grip_release',

  // Stretchable/Moldable hooks
  'on_stretch',
  'on_sculpt',

  // Humanoid/Avatar hooks
  'on_pose_change',
  'on_expression_change',
  'on_gesture',
  'on_speak',
  'on_pose_save',
  'on_morph_change',

  // Media Production hooks
  'on_record_start',
  'on_record_stop',
  'on_record_pause',
  'on_stream_start',
  'on_stream_stop',
  'on_viewer_join',
  'on_viewer_leave',
  'on_chat_message',
  'on_camera_switch',
  'on_video_end',
  'on_video_error',

  // Analytics hooks
  'on_track_event',
  'on_survey_start',
  'on_survey_complete',
  'on_survey_skip',
  'on_variant_assigned',
  'on_conversion',
  'on_hotspot_detected',

  // Social hooks
  'on_share',
  'on_share_complete',
  'on_embed',
  'on_scan',
  'on_user_join',
  'on_user_leave',
  'on_draw_stroke',
  'on_object_lock',
  'on_object_unlock',

  // Effects hooks
  'on_particle_spawn',
  'on_particle_death',
  'on_transition_start',
  'on_transition_complete',
  'on_filter_change',

  // Audio hooks
  'on_audio_start',
  'on_audio_end',
  'on_voice_command',
  'on_speech_start',
  'on_speech_end',
  'on_beat',
  'on_frequency_peak',

  // AI hooks
  'on_narration_start',
  'on_narration_end',
  'on_user_question',
  'on_response_ready',
  'on_emotion_change',
  'on_generation_complete',

  // Timeline hooks
  'on_timeline_start',
  'on_timeline_complete',
  'on_keyframe_hit',
  'on_keyframe_add',
  'on_beat_sync',
  'on_move_complete',
] as const;

export type LifecycleHookName = typeof LIFECYCLE_HOOKS[number];
