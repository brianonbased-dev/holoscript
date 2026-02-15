import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HoloScriptPlusRuntimeImpl } from '../runtime/HoloScriptPlusRuntime';
import { WebXRManager } from '../runtime/WebXRManager';
import { WebGPURenderer } from '../render/webgpu/WebGPURenderer';

// Mock WebXR Globals
const mockSession = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  requestReferenceSpace: vi.fn().mockResolvedValue({}),
  updateRenderState: vi.fn(),
  end: vi.fn().mockResolvedValue(undefined),
  inputSources: [
    {
      handedness: 'left',
      hand: {}, // Mock hand object
      profiles: ['oculus-touch'],
    },
    {
      handedness: 'right',
      hand: {},
      profiles: ['oculus-touch'],
    }
  ],
};

const mockNavigatorXR = {
  isSessionSupported: vi.fn().mockResolvedValue(true),
  requestSession: vi.fn().mockResolvedValue(mockSession),
};

const mockWebGPUDevice = {
  createTexture: vi.fn(),
  createCommandEncoder: vi.fn(),
};

const mockWebGPUContext = {
  device: mockWebGPUDevice,
  format: 'bgra8unorm',
};

describe('WebXR Integration', () => {
  let runtime: HoloScriptPlusRuntimeImpl;
  let renderer: WebGPURenderer;

  beforeEach(() => {
    // Setup Global Mocks using stubGlobal
    vi.stubGlobal('navigator', { 
      xr: mockNavigatorXR, 
      gpu: { requestAdapter: vi.fn() } 
    });
    
    vi.stubGlobal('XRWebGPUBinding', vi.fn().mockImplementation(function() {
      return {
        createProjectionLayer: vi.fn().mockReturnValue({}),
      };
    }));

    renderer = new WebGPURenderer();
    // Inject mock context
    (renderer as any).context = mockWebGPUContext;
    
    const mockAST = {
      root: {
        type: 'composition',
        id: 'root',
        children: [],
        traits: new Map(),
        properties: {},
        directives: []
      },
      imports: [],
      version: 1,
    };

    runtime = new HoloScriptPlusRuntimeImpl(mockAST as any, { 
      vrEnabled: true,
      renderer: renderer 
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('checks for WebXR support', async () => {
    const supported = await WebXRManager.isSupported();
    expect(supported).toBe(true);
    expect(mockNavigatorXR.isSessionSupported).toHaveBeenCalledWith('immersive-vr');
  });

  it('enters VR mode and initializes WebXRManager', async () => {
    await runtime.enterVR();

    // Verify Session Request
    expect(mockNavigatorXR.requestSession).toHaveBeenCalledWith('immersive-vr', expect.objectContaining({
      requiredFeatures: ['local-floor'],
    }));

    // Verify Session Setup
    expect(mockSession.addEventListener).toHaveBeenCalledWith('end', expect.any(Function));
    expect(mockSession.requestReferenceSpace).toHaveBeenCalledWith('local-floor');
    
    // Verify WebGPU Binding
    expect((global as any).XRWebGPUBinding).toHaveBeenCalled();
  });

  it('updates VR context from input sources', async () => {
    await runtime.enterVR();
    
    // Simulate one update loop tick
    // We need to trigger the updateVRInput logic. 
    // Since it's private and tied to the loop, we can verify via side effects or exposed context.
    
    // Helper to trigger the update manually since we can't easily wait for RAF in test
    (runtime as any).updateVRInput();

    const context = runtime.getContext();
    expect(context.vr.hands.left).toBeDefined();
    expect(context.vr.hands.right).toBeDefined();
    expect(context.vr.hands.left.id).toBe('left_hand');
  });

  it('exits VR mode correctly', async () => {
    await runtime.enterVR();
    await runtime.exitVR();

    expect(mockSession.end).toHaveBeenCalled();
  });
});
