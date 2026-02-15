/**
 * Self-Improvement Module
 *
 * Captures failed HoloScript code generations and converts them
 * into training data for the TrainingMonkey system, creating
 * a self-improving feedback loop.
 *
 * @module self-improvement
 */

export {
  SelfImprovementPipeline,
  type DifficultyLevel,
  type FailedGeneration,
  type FailureCategory,
  type PipelineConfig,
  type PipelineStats,
  type TrainingExample,
} from './SelfImprovementPipeline';
