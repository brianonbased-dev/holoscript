/**
 * Phase 6 Hololand Integration Module
 * 
 * Main exports for Phase 6 trait system integration with Hololand
 * Provides interfaces, types, and factory functions
 * 
 * @module phase6-hololand-integration
 */

export {
  HololandParserBridge,
  type ParserRegistrationResult,
  type ParserValidationError,
  type DeviceOptimizationContext,
  type CodeGenerationOptions,
} from './HololandParserBridge'

export { TraitAnnotationEditor } from './TraitAnnotationEditor'
export { RealtimePreviewEngine } from './RealtimePreviewEngine'
export { TraitEditor } from './TraitEditor'
export { PreviewDashboard } from './PreviewDashboard'

// Re-export types
export type { TraitConfig, TraitProperty, PresetDefinition } from './types'

/**
 * Phase 6 Hololand Integration Factory
 * 
 * Creates a complete Phase 6 + Hololand integration setup
 */
export function createPhase6HololandIntegration(config: any) {
  const editor = new TraitAnnotationEditor(config)
  const bridge = new HololandParserBridge(editor)
  const engine = new RealtimePreviewEngine()

  return {
    editor,
    bridge,
    engine,
    generateHoloScriptPlus: (options?: any) => bridge.generateHoloScriptPlusCode(options),
    registerTrait: (id: string, options?: any) => bridge.registerTraitWithParser(id, options),
    validateCode: (code: string) => bridge.validateHoloScriptPlus(code),
    registerDevice: (context: any) => bridge.registerDevice(context),
  }
}
