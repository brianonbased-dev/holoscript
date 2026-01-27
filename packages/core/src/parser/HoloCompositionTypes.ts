/**
 * .holo Composition AST Types
 *
 * Type definitions for the declarative .holo format.
 * This is a scene-centric language designed for AI agents and visual tools.
 *
 * @version 1.0.0
 */

// =============================================================================
// SOURCE LOCATION
// =============================================================================

export interface SourceLocation {
  line: number;
  column: number;
  offset?: number;
}

export interface SourceRange {
  start: SourceLocation;
  end: SourceLocation;
}

// =============================================================================
// BASE NODE
// =============================================================================

export interface HoloNode {
  type: string;
  loc?: SourceRange;
}

// =============================================================================
// VALUE TYPES
// =============================================================================

export type HoloValue =
  | string
  | number
  | boolean
  | null
  | HoloValue[]
  | HoloObject
  | HoloBindValue;

export interface HoloBindValue {
  __bind: true;
  source: string;       // e.g., "state.score"
  transform?: string;   // optional transform function name
}

export interface HoloObject {
  [key: string]: HoloValue;
}

export interface HoloPosition {
  x: number;
  y: number;
  z: number;
}

// =============================================================================
// COMPOSITION (ROOT NODE)
// =============================================================================

export interface HoloComposition extends HoloNode {
  type: 'Composition';
  name: string;
  environment?: HoloEnvironment;
  state?: HoloState;
  templates: HoloTemplate[];
  objects: HoloObjectDecl[];
  spatialGroups: HoloSpatialGroup[];
  lights: HoloLight[];
  effects?: HoloEffects;
  camera?: HoloCamera;
  logic?: HoloLogic;
  imports: HoloImport[];
  timelines: HoloTimeline[];
  audio: HoloAudio[];
  zones: HoloZone[];
  ui?: HoloUI;
  transitions: HoloTransition[];
  conditionals: HoloConditionalBlock[];
  iterators: HoloForEachBlock[];
}

// =============================================================================
// ENVIRONMENT
// =============================================================================

export interface HoloEnvironment extends HoloNode {
  type: 'Environment';
  properties: HoloEnvironmentProperty[];
}

export interface HoloEnvironmentProperty extends HoloNode {
  type: 'EnvironmentProperty';
  key: string;
  value: HoloValue | HoloParticleSystem | HoloLighting;
}

export interface HoloParticleSystem extends HoloNode {
  type: 'ParticleSystem';
  name: string;
  properties: Record<string, HoloValue>;
}

export interface HoloLighting extends HoloNode {
  type: 'Lighting';
  properties: Record<string, HoloValue>;
}

// =============================================================================
// LIGHT (first-class light block)
// =============================================================================

export interface HoloLight extends HoloNode {
  type: 'Light';
  name: string;
  lightType: 'directional' | 'point' | 'spot' | 'hemisphere' | 'ambient' | 'area';
  properties: HoloLightProperty[];
}

export interface HoloLightProperty extends HoloNode {
  type: 'LightProperty';
  key: string;
  value: HoloValue;
}

// =============================================================================
// EFFECTS (post-processing block)
// =============================================================================

export interface HoloEffects extends HoloNode {
  type: 'Effects';
  effects: HoloEffect[];
}

export interface HoloEffect extends HoloNode {
  type: 'Effect';
  effectType: string; // bloom, ssao, vignette, dof, etc.
  properties: Record<string, HoloValue>;
}

// =============================================================================
// CAMERA
// =============================================================================

export interface HoloCamera extends HoloNode {
  type: 'Camera';
  cameraType: 'perspective' | 'orthographic' | 'cinematic';
  properties: HoloCameraProperty[];
}

export interface HoloCameraProperty extends HoloNode {
  type: 'CameraProperty';
  key: string;
  value: HoloValue;
}

// =============================================================================
// TIMELINE (sequenced animation choreography)
// =============================================================================

export interface HoloTimeline extends HoloNode {
  type: 'Timeline';
  name: string;
  autoplay?: boolean;
  loop?: boolean;
  entries: HoloTimelineEntry[];
}

export interface HoloTimelineEntry extends HoloNode {
  type: 'TimelineEntry';
  time: number;
  action: HoloTimelineAction;
}

export type HoloTimelineAction =
  | { kind: 'animate'; target: string; properties: Record<string, HoloValue> }
  | { kind: 'emit'; event: string; data?: HoloValue }
  | { kind: 'call'; method: string; args?: HoloValue[] };

// =============================================================================
// AUDIO (first-class spatial/global audio)
// =============================================================================

export interface HoloAudio extends HoloNode {
  type: 'Audio';
  name: string;
  properties: HoloAudioProperty[];
}

export interface HoloAudioProperty extends HoloNode {
  type: 'AudioProperty';
  key: string;
  value: HoloValue;
}

// =============================================================================
// ZONE (interaction/trigger volumes)
// =============================================================================

export interface HoloZone extends HoloNode {
  type: 'Zone';
  name: string;
  properties: HoloZoneProperty[];
  handlers: HoloEventHandler[];
}

export interface HoloZoneProperty extends HoloNode {
  type: 'ZoneProperty';
  key: string;
  value: HoloValue;
}

// =============================================================================
// UI (HUD/overlay layer)
// =============================================================================

export interface HoloUI extends HoloNode {
  type: 'UI';
  elements: HoloUIElement[];
}

export interface HoloUIElement extends HoloNode {
  type: 'UIElement';
  name: string;
  properties: HoloUIProperty[];
}

export interface HoloUIProperty extends HoloNode {
  type: 'UIProperty';
  key: string;
  value: HoloValue;
}

// =============================================================================
// TRANSITION (scene-to-scene navigation effects)
// =============================================================================

export interface HoloTransition extends HoloNode {
  type: 'Transition';
  name: string;
  properties: HoloTransitionProperty[];
}

export interface HoloTransitionProperty extends HoloNode {
  type: 'TransitionProperty';
  key: string;
  value: HoloValue;
}

// =============================================================================
// CONDITIONAL BLOCK (scene-level if/else wrapping objects)
// =============================================================================

export interface HoloConditionalBlock extends HoloNode {
  type: 'ConditionalBlock';
  condition: string;
  objects: HoloObjectDecl[];
  spatialGroups?: HoloSpatialGroup[];
  elseObjects?: HoloObjectDecl[];
  elseSpatialGroups?: HoloSpatialGroup[];
}

// =============================================================================
// FOR-EACH BLOCK (scene-level iteration)
// =============================================================================

export interface HoloForEachBlock extends HoloNode {
  type: 'ForEachBlock';
  variable: string;
  iterable: string;
  objects: HoloObjectDecl[];
  spatialGroups?: HoloSpatialGroup[];
}

// =============================================================================
// STATE
// =============================================================================

export interface HoloState extends HoloNode {
  type: 'State';
  properties: HoloStateProperty[];
}

export interface HoloStateProperty extends HoloNode {
  type: 'StateProperty';
  key: string;
  value: HoloValue;
  reactive?: boolean;
}

// =============================================================================
// TEMPLATE
// =============================================================================

export interface HoloTemplate extends HoloNode {
  type: 'Template';
  name: string;
  properties: HoloTemplateProperty[];
  state?: HoloState;
  actions: HoloAction[];
  traits: HoloObjectTrait[];
}

export interface HoloTemplateProperty extends HoloNode {
  type: 'TemplateProperty';
  key: string;
  value: HoloValue;
}

// =============================================================================
// OBJECT
// =============================================================================

export interface HoloObjectDecl extends HoloNode {
  type: 'Object';
  name: string;
  template?: string; // "using" clause
  properties: HoloObjectProperty[];
  state?: HoloState;
  traits: HoloObjectTrait[];
  children?: HoloObjectDecl[];
}

export interface HoloObjectTrait extends HoloNode {
  type: 'ObjectTrait';
  name: string;
  config: Record<string, HoloValue>;
}

export interface HoloObjectProperty extends HoloNode {
  type: 'ObjectProperty';
  key: string;
  value: HoloValue;
}

// =============================================================================
// SPATIAL GROUP
// =============================================================================

export interface HoloSpatialGroup extends HoloNode {
  type: 'SpatialGroup';
  name: string;
  properties: HoloGroupProperty[];
  objects: HoloObjectDecl[];
  groups?: HoloSpatialGroup[]; // nested groups
}

export interface HoloGroupProperty extends HoloNode {
  type: 'GroupProperty';
  key: string;
  value: HoloValue;
}

// =============================================================================
// LOGIC
// =============================================================================

export interface HoloLogic extends HoloNode {
  type: 'Logic';
  handlers: HoloEventHandler[];
  actions: HoloAction[];
}

export interface HoloEventHandler extends HoloNode {
  type: 'EventHandler';
  event: string; // e.g., "on_enter", "on_player_attack"
  parameters: HoloParameter[];
  body: HoloStatement[];
}

export interface HoloAction extends HoloNode {
  type: 'Action';
  name: string;
  parameters: HoloParameter[];
  body: HoloStatement[];
  async?: boolean;
}

export interface HoloParameter extends HoloNode {
  type: 'Parameter';
  name: string;
  paramType?: string; // optional type annotation
  defaultValue?: HoloValue;
}

// =============================================================================
// STATEMENTS
// =============================================================================

export type HoloStatement =
  | HoloAssignment
  | HoloMethodCall
  | HoloIfStatement
  | HoloForStatement
  | HoloAwaitStatement
  | HoloReturnStatement
  | HoloEmitStatement
  | HoloAnimateStatement
  | HoloExpressionStatement;

export interface HoloAssignment extends HoloNode {
  type: 'Assignment';
  target: string; // e.g., "state.visitors", "enemy.health"
  operator: '=' | '+=' | '-=' | '*=' | '/=';
  value: HoloExpression;
}

export interface HoloMethodCall extends HoloNode {
  type: 'MethodCall';
  object?: string; // optional for global calls
  method: string;
  arguments: HoloExpression[];
}

export interface HoloIfStatement extends HoloNode {
  type: 'IfStatement';
  condition: HoloExpression;
  consequent: HoloStatement[];
  alternate?: HoloStatement[];
}

export interface HoloForStatement extends HoloNode {
  type: 'ForStatement';
  variable: string;
  iterable: HoloExpression;
  body: HoloStatement[];
}

export interface HoloAwaitStatement extends HoloNode {
  type: 'AwaitStatement';
  expression: HoloExpression;
}

export interface HoloReturnStatement extends HoloNode {
  type: 'ReturnStatement';
  value?: HoloExpression;
}

export interface HoloEmitStatement extends HoloNode {
  type: 'EmitStatement';
  event: string;
  data?: HoloExpression;
}

export interface HoloAnimateStatement extends HoloNode {
  type: 'AnimateStatement';
  target: string;
  properties: Record<string, HoloValue>;
}

export interface HoloExpressionStatement extends HoloNode {
  type: 'ExpressionStatement';
  expression: HoloExpression;
}

// =============================================================================
// EXPRESSIONS
// =============================================================================

export type HoloExpression =
  | HoloLiteral
  | HoloIdentifier
  | HoloBinaryExpression
  | HoloUnaryExpression
  | HoloMemberExpression
  | HoloCallExpression
  | HoloArrayExpression
  | HoloObjectExpression
  | HoloBindExpression;

export interface HoloLiteral extends HoloNode {
  type: 'Literal';
  value: string | number | boolean | null;
}

export interface HoloIdentifier extends HoloNode {
  type: 'Identifier';
  name: string;
}

export interface HoloBinaryExpression extends HoloNode {
  type: 'BinaryExpression';
  operator: string; // +, -, *, /, ==, !=, <, >, <=, >=, &&, ||
  left: HoloExpression;
  right: HoloExpression;
}

export interface HoloUnaryExpression extends HoloNode {
  type: 'UnaryExpression';
  operator: '!' | '-';
  argument: HoloExpression;
}

export interface HoloMemberExpression extends HoloNode {
  type: 'MemberExpression';
  object: HoloExpression;
  property: string;
  computed: boolean; // true for a[b], false for a.b
}

export interface HoloCallExpression extends HoloNode {
  type: 'CallExpression';
  callee: HoloExpression;
  arguments: HoloExpression[];
}

export interface HoloArrayExpression extends HoloNode {
  type: 'ArrayExpression';
  elements: HoloExpression[];
}

export interface HoloObjectExpression extends HoloNode {
  type: 'ObjectExpression';
  properties: { key: string; value: HoloExpression }[];
}

export interface HoloBindExpression extends HoloNode {
  type: 'BindExpression';
  source: string;       // e.g., "state.score"
  transform?: string;   // optional transform function name
}

// =============================================================================
// IMPORTS
// =============================================================================

export interface HoloImport extends HoloNode {
  type: 'Import';
  specifiers: HoloImportSpecifier[];
  source: string; // e.g., "./player.hsplus"
}

export interface HoloImportSpecifier extends HoloNode {
  type: 'ImportSpecifier';
  imported: string;
  local?: string; // alias
}

// =============================================================================
// PARSER RESULT
// =============================================================================

export interface HoloParseResult {
  success: boolean;
  ast?: HoloComposition;
  errors: HoloParseError[];
  warnings: HoloParseWarning[];
}

export interface HoloParseError {
  message: string;
  loc?: SourceLocation;
  code?: string;
}

export interface HoloParseWarning {
  message: string;
  loc?: SourceLocation;
  code?: string;
}

// =============================================================================
// PARSER OPTIONS
// =============================================================================

export interface HoloParserOptions {
  /** Include source locations in AST nodes */
  locations?: boolean;
  /** Collect errors instead of throwing */
  tolerant?: boolean;
  /** Enable strict mode (stricter validation) */
  strict?: boolean;
  /** Source filename for error messages */
  filename?: string;
}
