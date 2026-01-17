/**
 * Phase 6: Test Setup and Utilities
 * 
 * Common test utilities and setup for all component tests.
 */

import { vi } from 'vitest'
import React from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'

// Mock data
export const mockMaterialConfig = {
  type: 'material' as const,
  properties: {
    metallic: {
      name: 'metallic',
      value: 0.8,
      type: 'number' as const,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Metallic intensity',
      category: 'pbr',
    },
    roughness: {
      name: 'roughness',
      value: 0.2,
      type: 'number' as const,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Surface roughness',
      category: 'pbr',
    },
    baseColor: {
      name: 'baseColor',
      value: '#ffffff',
      type: 'color' as const,
      description: 'Base color',
      category: 'appearance',
    },
    type: {
      name: 'type',
      value: 'pbr',
      type: 'enum' as const,
      options: ['pbr', 'standard', 'unlit'],
      description: 'Material type',
      category: 'core',
    },
    useNormalMap: {
      name: 'useNormalMap',
      value: true,
      type: 'boolean' as const,
      description: 'Use normal map',
      category: 'textures',
    },
  },
  isDirty: false,
}

export const mockDevices = [
  { name: 'iPhone 15 Pro', platform: 'mobile' as const, width: 1179, height: 2556, dpi: 460, gpuMemory: 256 },
  { name: 'iPad Pro 12.9', platform: 'mobile' as const, width: 2732, height: 2048, dpi: 264, gpuMemory: 512 },
  { name: 'Meta Quest 3', platform: 'vr' as const, width: 1728, height: 1824, dpi: 659, gpuMemory: 384 },
  { name: 'Apple Vision Pro', platform: 'vr' as const, width: 4120, height: 2620, dpi: 1090, gpuMemory: 512 },
  { name: 'HoloLens 2', platform: 'vr' as const, width: 1280, height: 720, dpi: 290, gpuMemory: 256 },
  { name: 'RTX 4090', platform: 'desktop' as const, width: 3840, height: 2160, dpi: 92, gpuMemory: 8192 },
]

export const mockMetrics = {
  fps: 60,
  gpuMemory: 256,
  gpuMemoryPercent: 50,
  drawCalls: 150,
  verticesRendered: 2000000,
  shaderCompileTime: 25,
  timestamp: Date.now(),
}

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add custom options here if needed
}

export function render(
  ui: React.ReactElement,
  options?: CustomRenderOptions,
) {
  return rtlRender(ui, { ...options })
}

// Performance measurement utility
export class PerformanceMeasure {
  private marks: Map<string, number> = new Map()

  start(label: string) {
    this.marks.set(`${label}_start`, performance.now())
  }

  end(label: string): number {
    const startTime = this.marks.get(`${label}_start`)
    if (!startTime) {
      console.warn(`No start mark found for ${label}`)
      return 0
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    this.marks.set(`${label}_duration`, duration)
    this.marks.delete(`${label}_start`)

    return duration
  }

  getDuration(label: string): number {
    return this.marks.get(`${label}_duration`) || 0
  }

  getReport(): Record<string, number> {
    const report: Record<string, number> = {}
    this.marks.forEach((value, key) => {
      if (key.endsWith('_duration')) {
        const label = key.replace('_duration', '')
        report[label] = value
      }
    })
    return report
  }

  clear() {
    this.marks.clear()
  }
}

// Memory measurement utility
export class MemoryMeasure {
  private initialMemory: number = 0

  start() {
    if (typeof performance !== 'undefined' && performance.memory) {
      this.initialMemory = performance.memory.usedJSHeapSize
    }
  }

  getDelta(): number {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize - this.initialMemory
    }
    return 0
  }

  reset() {
    this.initialMemory = 0
  }
}

// Wait utilities
export function waitFor(callback: () => void, timeout = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      try {
        callback()
        clearInterval(interval)
        resolve()
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval)
          reject(error)
        }
      }
    }, 50)
  })
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Mock event generators
export const createMouseEvent = (type: string, options = {}) =>
  new MouseEvent(type, { bubbles: true, cancelable: true, ...options })

export const createChangeEvent = (value: unknown) =>
  new Event('change', { bubbles: true, cancelable: true })

// Spy utilities
export const createSpyFunction = <T extends any[], R>(fn?: (...args: T) => R) =>
  vi.fn(fn || (() => undefined) as any)

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Cleanup after each test
  vi.clearAllTimers()
})

// Export render as default
export default render
