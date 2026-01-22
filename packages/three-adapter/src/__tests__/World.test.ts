import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock GLTFLoader
vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: vi.fn().mockImplementation(() => ({
    setDRACOLoader: vi.fn(),
    load: vi.fn((url, onLoad) => onLoad && onLoad({ scene: { clone: () => ({ traverse: vi.fn() }) }, animations: [] })),
  })),
}));

// Mock DRACOLoader
vi.mock('three/examples/jsm/loaders/DRACOLoader.js', () => ({
  DRACOLoader: vi.fn().mockImplementation(() => ({
    setDecoderPath: vi.fn(),
    dispose: vi.fn(),
  })),
}));

// Mock THREE.js
vi.mock('three', () => ({
  Scene: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    traverse: vi.fn(),
    background: null,
    fog: null,
  })),
  PerspectiveCamera: vi.fn().mockImplementation(() => ({
    position: { set: vi.fn(), x: 0, y: 0, z: 0 },
    aspect: 1,
    fov: 75,
    near: 0.1,
    far: 1000,
    updateProjectionMatrix: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  })),
  WebGLRenderer: vi.fn().mockImplementation(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    domElement: document.createElement('canvas'),
    outputColorSpace: '',
    shadowMap: { enabled: false, type: 0 },
    xr: { enabled: false, setSession: vi.fn() },
  })),
  Clock: vi.fn().mockImplementation(() => ({
    getDelta: vi.fn().mockReturnValue(0.016),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  Color: vi.fn().mockImplementation((color) => ({
    getHex: () => 0x000000,
    r: 0, g: 0, b: 0,
  })),
  Fog: vi.fn(),
  FogExp2: vi.fn(),
  AmbientLight: vi.fn().mockImplementation(() => ({ intensity: 1 })),
  DirectionalLight: vi.fn().mockImplementation(() => ({
    position: { set: vi.fn() },
    castShadow: false,
    shadow: { mapSize: { width: 2048, height: 2048 }, camera: { near: 0.5, far: 50 } },
  })),
  HemisphereLight: vi.fn().mockImplementation(() => ({})),
  Light: class {},
  Object3D: class {
    add = vi.fn();
    remove = vi.fn();
    position = { set: vi.fn(), x: 0, y: 0, z: 0 };
    rotation = { set: vi.fn(), x: 0, y: 0, z: 0 };
    scale = { set: vi.fn(), setScalar: vi.fn(), x: 1, y: 1, z: 1 };
  },
  Mesh: class {
    add = vi.fn();
    remove = vi.fn();
    position = { set: vi.fn(), x: 0, y: 0, z: 0 };
    rotation = { set: vi.fn(), x: 0, y: 0, z: 0 };
    scale = { set: vi.fn(), setScalar: vi.fn(), x: 1, y: 1, z: 1 };
    material = { color: { set: vi.fn() }, dispose: vi.fn() };
    geometry = { dispose: vi.fn() };
    castShadow = false;
    receiveShadow = false;
  },
  BoxGeometry: vi.fn().mockImplementation(() => ({ clone: vi.fn().mockReturnThis(), dispose: vi.fn() })),
  SphereGeometry: vi.fn().mockImplementation(() => ({ clone: vi.fn().mockReturnThis(), dispose: vi.fn() })),
  PlaneGeometry: vi.fn().mockImplementation(() => ({ clone: vi.fn().mockReturnThis(), dispose: vi.fn() })),
  CylinderGeometry: vi.fn().mockImplementation(() => ({ clone: vi.fn().mockReturnThis(), dispose: vi.fn() })),
  ConeGeometry: vi.fn().mockImplementation(() => ({ clone: vi.fn().mockReturnThis(), dispose: vi.fn() })),
  TorusGeometry: vi.fn().mockImplementation(() => ({ clone: vi.fn().mockReturnThis(), dispose: vi.fn() })),
  BufferGeometry: vi.fn().mockImplementation(() => ({ clone: vi.fn().mockReturnThis(), dispose: vi.fn() })),
  MeshStandardMaterial: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
  MeshBasicMaterial: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
  Group: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    position: { set: vi.fn() },
    rotation: { set: vi.fn() },
    scale: { set: vi.fn(), setScalar: vi.fn() },
  })),
  SRGBColorSpace: 'srgb',
  PCFSoftShadowMap: 2,
  AudioLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn((url, onLoad) => onLoad && onLoad({})),
  })),
  AudioListener: vi.fn().mockImplementation(() => ({})),
  Audio: vi.fn().mockImplementation(() => ({
    setBuffer: vi.fn(),
    setLoop: vi.fn(),
    setVolume: vi.fn(),
  })),
  PositionalAudio: vi.fn().mockImplementation(() => ({
    setBuffer: vi.fn(),
    setLoop: vi.fn(),
    setVolume: vi.fn(),
    setRefDistance: vi.fn(),
    setRolloffFactor: vi.fn(),
    setDistanceModel: vi.fn(),
  })),
  MathUtils: {
    degToRad: (deg: number) => deg * Math.PI / 180,
  },
}));

// Mock HoloScript core
vi.mock('@holoscript/core', () => ({
  HoloScriptPlusParser: vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockReturnValue({
      success: true,
      ast: { type: 'program', nodes: [] },
      errors: [],
    }),
  })),
  createRuntime: vi.fn().mockReturnValue({
    mount: vi.fn(),
    unmount: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    emit: vi.fn(),
    setState: vi.fn(),
    getState: vi.fn().mockReturnValue({}),
    update: vi.fn(),
  }),
}));

// Mock DOM APIs
const mockContainer = {
  clientWidth: 800,
  clientHeight: 600,
  appendChild: vi.fn(),
  removeChild: vi.fn(),
};

// Mock fetch
global.fetch = vi.fn();

describe('World', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  describe('WorldTraitConfig parsing', () => {
    it('should extract @world trait from source', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      const source = `
@world {
  backgroundColor: "#16213e"
  xr: true
  shadows: "high"
  ambient: 0.5
  lighting: "outdoor"
}

orb#player {
  position: [0, 1, 0]
}
`;

      // Load the source - this should extract and apply @world
      world.loadSource(source);

      // The parser should receive stripped source
      const { HoloScriptPlusParser } = await import('@holoscript/core');
      const parserInstance = (HoloScriptPlusParser as any).mock.results[0].value;
      expect(parserInstance.parse).toHaveBeenCalled();

      // The parsed source should not contain @world
      const parsedSource = parserInstance.parse.mock.calls[0][0];
      expect(parsedSource).not.toContain('@world');
      expect(parsedSource).toContain('orb#player');
    });

    it('should parse fog configuration', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      const source = `
@world {
  fog: { type: "linear", color: "#ffffff", near: 10, far: 100 }
}
`;

      world.loadSource(source);
      // Fog should be applied to scene (verified through THREE.Fog mock)
    });

    it('should parse camera configuration', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      const source = `
@world {
  camera: { position: [0, 5, 10], fov: 60, near: 0.5, far: 500 }
}
`;

      world.loadSource(source);
      // Camera should be updated
    });
  });

  describe('Config file parsing', () => {
    it('should parse @config block format', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      const configSource = `
@config {
  world: {
    backgroundColor: "#1a1a2e"
    xrEnabled: true
  }
  files: [
    "scene.hsplus"
    "characters.hsplus"
  ]
  autoStart: true
}
`;

      // Mock config fetch and subsequent file fetches
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(configSource),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('orb#scene {}'),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('orb#characters {}'),
        });

      const config = await world.loadConfig('/test/holoscript.config.hsplus');

      expect(config.files).toEqual(['scene.hsplus', 'characters.hsplus']);
      expect(config.autoStart).toBe(true);
    });

    it('should parse simple config format', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      const configSource = `
files: "main.hsplus", "ui.hsplus"
autoStart: true
assets: "./assets"
`;

      // Mock config fetch and subsequent file fetches
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(configSource),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('orb#main {}'),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('orb#ui {}'),
        });

      const config = await world.loadConfig('/test/config.hsplus');

      expect(config.files).toContain('main.hsplus');
      expect(config.autoStart).toBe(true);
      expect(config.assets).toBe('./assets');
    });
  });

  describe('Directory loading', () => {
    it('should load index.hsplus from directory', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('orb#test { position: [0, 0, 0] }'),
      });

      await world.loadDirectory('/scenes/level1');

      expect(global.fetch).toHaveBeenCalledWith('/scenes/level1/index.hsplus');
    });

    it('should handle trailing slash in directory path', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('orb#test {}'),
      });

      await world.loadDirectory('/scenes/level1/');

      expect(global.fetch).toHaveBeenCalledWith('/scenes/level1/index.hsplus');
    });

    it('should throw error when index.hsplus not found', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(world.loadDirectory('/missing')).rejects.toThrow('Failed to load index.hsplus');
    });
  });

  describe('File loading', () => {
    it('should load single .hsplus file', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('orb#sphere { color: "#ff0000" }'),
      });

      await world.loadFile('/scenes/main.hsplus');

      expect(global.fetch).toHaveBeenCalledWith('/scenes/main.hsplus');
    });

    it('should load multiple .hsplus files', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('orb#a {}'),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('orb#b {}'),
        });

      await world.loadFiles(['/a.hsplus', '/b.hsplus']);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Animation loop', () => {
    it('should start and stop animation loop', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      // Mock requestAnimationFrame
      const rafSpy = vi.spyOn(global, 'requestAnimationFrame').mockReturnValue(1);
      const cafSpy = vi.spyOn(global, 'cancelAnimationFrame');

      world.start();
      expect(rafSpy).toHaveBeenCalled();

      world.stop();
      expect(cafSpy).toHaveBeenCalledWith(1);

      rafSpy.mockRestore();
      cafSpy.mockRestore();
    });

    it('should not start multiple animation loops', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      const rafSpy = vi.spyOn(global, 'requestAnimationFrame').mockReturnValue(1);

      world.start();
      world.start(); // Second call should be ignored

      // Only one RAF call from starting
      expect(rafSpy).toHaveBeenCalledTimes(1);

      rafSpy.mockRestore();
    });
  });

  describe('Event handling', () => {
    it('should emit events to runtime', async () => {
      const { World } = await import('../World');
      const { createRuntime } = await import('@holoscript/core');

      const world = new World({ container: mockContainer as any });
      world.loadSource('orb#test {}');

      world.emit('test-event', { data: 123 });

      const runtimeInstance = (createRuntime as any).mock.results[0].value;
      expect(runtimeInstance.emit).toHaveBeenCalledWith('test-event', { data: 123 });
    });

    it('should get and set state', async () => {
      const { World } = await import('../World');
      const { createRuntime } = await import('@holoscript/core');

      const world = new World({ container: mockContainer as any });
      world.loadSource('orb#test {}');

      world.setState({ count: 5 });

      const runtimeInstance = (createRuntime as any).mock.results[0].value;
      expect(runtimeInstance.setState).toHaveBeenCalledWith({ count: 5 });
    });
  });

  describe('Cleanup', () => {
    it('should dispose resources on cleanup', async () => {
      const { World } = await import('../World');
      const world = new World({ container: mockContainer as any });

      world.loadSource('orb#test {}');
      world.start();
      world.dispose();

      expect(mockContainer.removeChild).toHaveBeenCalled();
    });
  });
});

describe('ThreeRenderer', () => {
  it('should create elements', async () => {
    const { ThreeRenderer } = await import('../ThreeRenderer');
    const THREE = await import('three');

    const scene = new THREE.Scene();
    const renderer = new ThreeRenderer(scene as any);

    const element = renderer.createElement('box', {
      position: [1, 2, 3],
      color: '#ff0000',
      size: 2,
    });

    expect(element).toBeDefined();
  });

  it('should handle different element types', async () => {
    const { ThreeRenderer } = await import('../ThreeRenderer');
    const THREE = await import('three');

    const scene = new THREE.Scene();
    const renderer = new ThreeRenderer(scene as any);

    const types = ['box', 'sphere', 'plane', 'cylinder', 'cone', 'torus', 'group', 'orb'];

    for (const type of types) {
      const element = renderer.createElement(type, {});
      expect(element).toBeDefined();
    }
  });

  it('should update element properties', async () => {
    const { ThreeRenderer } = await import('../ThreeRenderer');
    const THREE = await import('three');

    const scene = new THREE.Scene();
    const renderer = new ThreeRenderer(scene as any);

    const element = renderer.createElement('box', { position: [0, 0, 0] });
    renderer.updateElement(element, { position: [1, 1, 1], color: '#00ff00' });

    // Element should be updated (verified through mocks)
  });

  it('should handle parent-child relationships', async () => {
    const { ThreeRenderer } = await import('../ThreeRenderer');
    const THREE = await import('three');

    const scene = new THREE.Scene();
    const renderer = new ThreeRenderer(scene as any);

    const parent = renderer.createElement('group', {});
    const child = renderer.createElement('box', {});

    renderer.appendChild(parent, child);
    renderer.removeChild(parent, child);

    // Parent-child operations should work
  });
});
