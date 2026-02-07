<script setup>
import { useData } from 'vitepress';
const { isDark } = useData();
</script>

<template>
  <div class="landing-page">
    <!-- NAV BAR -->
    <nav class="landing-nav">
      <div class="nav-container">
        <a href="/" class="nav-logo">
          <img src="/logo.svg" alt="HoloScript" class="nav-logo-img" />
          <span>HoloScript</span>
        </a>
        <div class="nav-links">
          <a href="/guides/">Docs</a>
          <a href="/guides/quick-start">Quick Start</a>
          <a href="/examples/">Examples</a>
          <a href="/api/traits">Traits</a>
          <a href="https://github.com/brianonbased-dev/Holoscript" class="nav-github">GitHub</a>
        </div>
      </div>
    </nav>

    <!-- HERO -->
    <section class="hero">
      <div class="hero-grid-bg"></div>
      <div class="container hero-content">
        <h1>Create VR Worlds<br />Without the Complexity</h1>
        <p class="hero-sub">
          HoloScript is an open-source language that makes building VR/AR experiences as simple as
          writing HTML. <strong>56 traits. Any browser. Zero setup.</strong>
        </p>
        <div class="hero-buttons">
          <a href="/guides/quick-start" class="btn btn-primary">Get Started Free</a>
          <a href="https://github.com/brianonbased-dev/Holoscript" class="btn btn-outline"
            >View on GitHub</a
          >
        </div>
        <div class="code-preview">
          <div class="code-tab">example.holo</div>
          <pre><code><span class="kw">composition</span> <span class="st">"My World"</span> {
  <span class="kw">object</span> <span class="st">"Crystal"</span> <span class="tr">@spinning</span> <span class="tr">@glowing</span> {
    <span class="pr">geometry:</span> <span class="st">"sphere"</span>
    <span class="pr">color:</span> <span class="st">"#00ffff"</span>
    <span class="pr">position:</span> [<span class="nm">0</span>, <span class="nm">2</span>, <span class="nm">-3</span>]
  }
}</code></pre>
        </div>
      </div>
    </section>

    <!-- PROBLEM -->
    <section class="section">
      <div class="container">
        <h2 class="section-title">The Problem with VR Development</h2>
        <div class="grid-3">
          <div class="card">
            <div class="card-icon">&#x1F4DA;</div>
            <h3 class="card-title card-title--red">Steep Learning Curve</h3>
            <p>
              Unity and Unreal require months of study. Complex SDKs and verbose code block
              creativity before it begins.
            </p>
          </div>
          <div class="card">
            <div class="card-icon">&#x1F9E9;</div>
            <h3 class="card-title card-title--red">Too Much Boilerplate</h3>
            <p>
              A simple 3D scene takes 200+ lines. Scene graphs, materials, renderers, cameras —
              endless configuration.
            </p>
          </div>
          <div class="card">
            <div class="card-icon">&#x1F512;</div>
            <h3 class="card-title card-title--red">Platform Lock-in</h3>
            <p>
              Build for Unity? Can't use in Unreal. No universal format means wasted time and
              duplicated effort.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- SOLUTION -->
    <section class="section section--alt">
      <div class="container">
        <h2 class="section-title">The HoloScript Solution</h2>
        <div class="grid-3">
          <div class="card card--glow">
            <div class="card-icon">&#x270D;&#xFE0F;</div>
            <h3 class="card-title card-title--cyan">Write It</h3>
            <p>
              Describe your VR world in plain .holo files. No complex APIs or framework knowledge
              required.
            </p>
          </div>
          <div class="card card--glow">
            <div class="card-icon">&#x1F441;&#xFE0F;</div>
            <h3 class="card-title card-title--cyan">See It</h3>
            <p>
              Instant browser preview with WebXR. Test on desktop, mobile, or VR headset — no
              compilation steps.
            </p>
          </div>
          <div class="card card--glow">
            <div class="card-icon">&#x1F680;</div>
            <h3 class="card-title card-title--cyan">Share It</h3>
            <p>
              One-click share links that run everywhere. True write-once, deploy-anywhere for VR.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CODE COMPARISON -->
    <section class="section">
      <div class="container">
        <h2 class="section-title">See the Difference</h2>
        <p class="section-sub">
          A spinning, glowing sphere. Same result — vastly different effort.
        </p>
        <div class="comparison">
          <div class="code-block">
            <div class="code-header">
              <span>Three.js</span>
              <span class="badge badge--red">32 lines</span>
            </div>
            <pre
              class="code-body"
            ><code><span class="kw">import</span> * <span class="kw">as</span> THREE <span class="kw">from</span> <span class="st">'three'</span>;

<span class="kw">const</span> scene = <span class="kw">new</span> THREE.Scene();
<span class="kw">const</span> camera = <span class="kw">new</span> THREE.PerspectiveCamera(
  <span class="nm">75</span>, innerWidth / innerHeight, <span class="nm">0.1</span>, <span class="nm">1000</span>
);
<span class="kw">const</span> renderer = <span class="kw">new</span> THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

<span class="kw">const</span> geo = <span class="kw">new</span> THREE.SphereGeometry(<span class="nm">1</span>,<span class="nm">32</span>,<span class="nm">32</span>);
<span class="kw">const</span> mat = <span class="kw">new</span> THREE.MeshStandardMaterial({
  color: <span class="nm">0x00ffff</span>,
  emissive: <span class="nm">0x00ffff</span>,
  emissiveIntensity: <span class="nm">0.5</span>
});
<span class="kw">const</span> sphere = <span class="kw">new</span> THREE.Mesh(geo, mat);
sphere.position.set(<span class="nm">0</span>, <span class="nm">2</span>, <span class="nm">-3</span>);
scene.add(sphere);

<span class="kw">const</span> light = <span class="kw">new</span> THREE.PointLight(<span class="nm">0xffffff</span>);
light.position.set(<span class="nm">5</span>, <span class="nm">5</span>, <span class="nm">5</span>);
scene.add(light);
camera.position.z = <span class="nm">5</span>;

<span class="kw">function</span> animate() {
  requestAnimationFrame(animate);
  sphere.rotation.y += <span class="nm">0.01</span>;
  renderer.render(scene, camera);
}
animate();</code></pre>
          </div>
          <div class="code-block">
            <div class="code-header">
              <span>HoloScript</span>
              <span class="badge badge--green">6 lines</span>
            </div>
            <pre
              class="code-body"
            ><code><span class="kw">composition</span> <span class="st">"My World"</span> {
  <span class="kw">object</span> <span class="st">"Crystal"</span> <span class="tr">@spinning</span> <span class="tr">@glowing</span> {
    <span class="pr">geometry:</span> <span class="st">"sphere"</span>
    <span class="pr">color:</span> <span class="st">"#00ffff"</span>
    <span class="pr">position:</span> [<span class="nm">0</span>, <span class="nm">2</span>, <span class="nm">-3</span>]
  }
}</code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- TRAITS -->
    <section class="section section--alt">
      <div class="container">
        <h2 class="section-title">56 Built-in Traits</h2>
        <p class="section-sub">Add powerful behaviors with simple decorators. No code required.</p>
        <div class="traits-grid">
          <div class="trait" v-for="t in traits" :key="t.name">
            <span class="trait-cat" :class="'cat-' + t.cat">{{ t.catLabel }}</span>
            <code class="trait-name">@{{ t.name }}</code>
            <p class="trait-desc">{{ t.desc }}</p>
          </div>
        </div>
        <p style="text-align: center; margin-top: 2rem">
          <a
            href="/api/traits"
            class="btn btn-outline"
            style="padding: 0.75rem 2rem; font-size: 1rem"
            >See All 56 Traits &rarr;</a
          >
        </p>
      </div>
    </section>

    <!-- USE CASES -->
    <section class="section">
      <div class="container">
        <h2 class="section-title">Built for Every Creator</h2>
        <div class="grid-4">
          <div class="use-card">
            <div class="use-icon">&#x1F393;</div>
            <h3>Education</h3>
            <p>
              Virtual classrooms, interactive labs, and historical recreations without technical
              barriers.
            </p>
          </div>
          <div class="use-card">
            <div class="use-icon">&#x1F3A8;</div>
            <h3>Art &amp; Design</h3>
            <p>3D galleries, interactive exhibits, and digital installations in virtual space.</p>
          </div>
          <div class="use-card">
            <div class="use-icon">&#x1F3AE;</div>
            <h3>Gaming</h3>
            <p>Indie VR games, physics sandboxes, and interactive worlds. Rapid prototyping.</p>
          </div>
          <div class="use-card">
            <div class="use-icon">&#x1F3D7;&#xFE0F;</div>
            <h3>Architecture</h3>
            <p>Walkthrough models, client presentations, and design reviews in immersive VR.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="section section--alt">
      <div class="container">
        <h2 class="section-title">Everything You Need</h2>
        <div class="grid-3">
          <div class="card card--glow" style="text-align: center">
            <div class="feature-number">56</div>
            <h3 class="card-title card-title--cyan">Built-in Traits</h3>
            <p>From physics to AI, every behavior is one decorator away</p>
          </div>
          <div class="card card--glow" style="text-align: center">
            <div class="card-icon">&#x26A1;</div>
            <h3 class="card-title card-title--cyan">Instant Preview</h3>
            <p>See changes live in the browser. No build step required</p>
          </div>
          <div class="card card--glow" style="text-align: center">
            <div class="card-icon">&#x1F48E;</div>
            <h3 class="card-title card-title--cyan">Open Source</h3>
            <p>MIT licensed. Free forever. Community-driven</p>
          </div>
          <div class="card card--glow" style="text-align: center">
            <div class="card-icon">&#x1F97D;</div>
            <h3 class="card-title card-title--cyan">WebXR Native</h3>
            <p>Works on any VR headset through the browser</p>
          </div>
          <div class="card card--glow" style="text-align: center">
            <div class="card-icon">&#x1F916;</div>
            <h3 class="card-title card-title--cyan">AI-Powered</h3>
            <p>Grok and Claude can generate scenes from plain text</p>
          </div>
          <div class="card card--glow" style="text-align: center">
            <div class="card-icon">&#x1F504;</div>
            <h3 class="card-title card-title--cyan">Cross-Platform</h3>
            <p>Export to Unity, Blender, VRChat. No lock-in</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section cta-section">
      <div class="container" style="text-align: center">
        <h2 class="cta-title">Ready to Build Your First VR World?</h2>
        <p class="section-sub" style="margin-bottom: 2.5rem">
          Join creators worldwide. Free and open-source.
        </p>
        <a href="/guides/quick-start" class="btn btn-primary btn-large">Start Building Now</a>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="landing-footer">
      <div class="container footer-content">
        <div class="footer-links">
          <a href="https://github.com/brianonbased-dev/Holoscript">GitHub</a>
          <a href="/guides/">Docs</a>
          <a href="/guides/quick-start">Quick Start</a>
          <a href="/examples/">Examples</a>
          <a href="https://x.com/holoscript">X / Twitter</a>
        </div>
        <p class="footer-tagline">Made with love for the VR community</p>
        <span class="license-badge">MIT License</span>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  data() {
    return {
      traits: [
        {
          name: 'grabbable',
          desc: 'Pick up and move objects in VR',
          cat: 'interact',
          catLabel: 'Interaction',
        },
        {
          name: 'teleport',
          desc: 'Teleport movement with arc indicator',
          cat: 'interact',
          catLabel: 'Interaction',
        },
        {
          name: 'clickable',
          desc: 'Respond to user clicks and taps',
          cat: 'interact',
          catLabel: 'Interaction',
        },
        { name: 'glowing', desc: 'Add emissive glow effects', cat: 'visual', catLabel: 'Visual' },
        {
          name: 'particle_system',
          desc: 'Generate particle effects',
          cat: 'visual',
          catLabel: 'Visual',
        },
        {
          name: 'weather',
          desc: 'Rain, snow, or fog atmospherics',
          cat: 'visual',
          catLabel: 'Visual',
        },
        {
          name: 'physics',
          desc: 'Realistic physics simulation',
          cat: 'physics',
          catLabel: 'Physics',
        },
        {
          name: 'cloth',
          desc: 'Fabric and soft body dynamics',
          cat: 'physics',
          catLabel: 'Physics',
        },
        {
          name: 'portal',
          desc: 'Teleportation gateways between spaces',
          cat: 'physics',
          catLabel: 'Physics',
        },
        {
          name: 'behavior_tree',
          desc: 'AI-driven object behaviors',
          cat: 'smart',
          catLabel: 'Smart',
        },
        {
          name: 'networked',
          desc: 'Sync across multiplayer sessions',
          cat: 'smart',
          catLabel: 'Smart',
        },
        {
          name: 'hand_tracking',
          desc: 'Natural hand gesture interaction',
          cat: 'smart',
          catLabel: 'Smart',
        },
      ],
    };
  },
};
</script>

<style scoped>
/* ========= VARIABLES ========= */
.landing-page {
  --bg: #0a0a1a;
  --bg-card: #12122a;
  --cyan: #00ffff;
  --purple: #8b5cf6;
  --text: #ffffff;
  --text2: #a0a0b8;
  --border: rgba(255, 255, 255, 0.1);
  --glow: 0 0 30px rgba(0, 255, 255, 0.15);

  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  color: var(--text);
  background: var(--bg);
  line-height: 1.6;
}

/* ========= NAV ========= */
.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(10, 10, 26, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding: 0.75rem 0;
}
.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--text);
  font-weight: 700;
  font-size: 1.25rem;
}
.nav-logo-img {
  height: 28px;
}
.nav-links {
  display: flex;
  gap: 1.5rem;
}
.nav-links a {
  color: var(--text2);
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s;
}
.nav-links a:hover {
  color: var(--cyan);
}
.nav-github {
  color: var(--cyan) !important;
  font-weight: 600;
}

/* ========= LAYOUT ========= */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
.section {
  padding: 6rem 0;
}
.section--alt {
  background: rgba(18, 18, 42, 0.3);
}
.section-title {
  text-align: center;
  font-size: clamp(2rem, 4vw, 3rem);
  margin-bottom: 1rem;
}
.section-sub {
  text-align: center;
  color: var(--text2);
  font-size: 1.125rem;
  max-width: 700px;
  margin: 0 auto 3rem;
}

/* ========= BUTTONS ========= */
.btn {
  display: inline-block;
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s;
  border: 2px solid transparent;
  cursor: pointer;
}
.btn-primary {
  background: var(--cyan);
  color: var(--bg);
  box-shadow: var(--glow);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 40px rgba(0, 255, 255, 0.35);
}
.btn-outline {
  background: transparent;
  color: var(--text);
  border-color: var(--cyan);
}
.btn-outline:hover {
  background: rgba(0, 255, 255, 0.1);
  transform: translateY(-2px);
}
.btn-large {
  font-size: 1.25rem;
  padding: 1.25rem 3rem;
}

/* ========= GRIDS ========= */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}
.grid-4 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

/* ========= CARDS ========= */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s;
}
.card:hover {
  transform: translateY(-4px);
  border-color: rgba(0, 255, 255, 0.25);
}
.card--glow:hover {
  box-shadow: var(--glow);
}
.card-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}
.card-title {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}
.card-title--red {
  color: #ef4444;
}
.card-title--cyan {
  color: var(--cyan);
}
.card p {
  color: var(--text2);
  font-size: 0.95rem;
}

/* ========= HERO ========= */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  overflow: hidden;
  padding-top: 5rem;
}
.hero-grid-bg {
  position: absolute;
  inset: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
  pointer-events: none;
}
@keyframes gridMove {
  to {
    transform: translate(50px, 50px);
  }
}
.hero-content {
  position: relative;
  z-index: 1;
}
.hero h1 {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  background: linear-gradient(135deg, var(--cyan), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  line-height: 1.15;
}
.hero-sub {
  font-size: clamp(1.1rem, 2.5vw, 1.4rem);
  color: var(--text2);
  max-width: 750px;
  margin: 0 auto 2.5rem;
}
.hero-sub strong {
  color: var(--text);
}
.hero-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 3.5rem;
}

/* ========= CODE PREVIEW ========= */
.code-preview {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  max-width: 550px;
  margin: 0 auto;
  text-align: left;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.code-tab {
  padding: 0.5rem 1rem;
  background: rgba(0, 255, 255, 0.08);
  border-bottom: 1px solid var(--border);
  font-size: 0.8rem;
  color: var(--cyan);
  font-family: monospace;
}
.code-preview pre {
  padding: 1.5rem;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.8;
  overflow-x: auto;
}
.code-preview code {
  background: none;
}

/* ========= SYNTAX COLORS ========= */
.kw {
  color: var(--purple);
}
.st {
  color: #7dd3fc;
}
.pr {
  color: #fbbf24;
}
.nm {
  color: #34d399;
}
.tr {
  color: var(--cyan);
  font-weight: 700;
}

/* ========= CODE COMPARISON ========= */
.comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}
.code-block {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.code-header {
  padding: 1rem;
  background: rgba(0, 255, 255, 0.08);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}
.badge--red {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}
.badge--green {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}
.code-body {
  padding: 1.5rem;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.7;
  overflow-x: auto;
}
.code-body code {
  background: none;
}

/* ========= TRAITS GRID ========= */
.traits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
.trait {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
  transition: all 0.3s;
}
.trait:hover {
  transform: translateY(-4px);
  border-color: rgba(0, 255, 255, 0.3);
}
.trait-cat {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 0.6rem;
}
.cat-interact {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}
.cat-visual {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}
.cat-physics {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}
.cat-smart {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}
.trait-name {
  display: block;
  font-size: 1.1rem;
  color: var(--cyan);
  margin-bottom: 0.4rem;
}
.trait-desc {
  font-size: 0.8rem;
  color: var(--text2);
  margin: 0;
}

/* ========= USE CASES ========= */
.use-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}
.use-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--cyan), var(--purple));
}
.use-card:hover {
  transform: translateY(-4px);
}
.use-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}
.use-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}
.use-card p {
  color: var(--text2);
  font-size: 0.9rem;
}

/* ========= FEATURES ========= */
.feature-number {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--cyan), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ========= CTA ========= */
.cta-section {
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.05), rgba(139, 92, 246, 0.05));
  border-radius: 24px;
  margin: 2rem auto;
  max-width: 900px;
  padding: 4rem 2rem;
}
.cta-title {
  font-size: clamp(2rem, 4vw, 2.75rem);
  background: linear-gradient(135deg, var(--cyan), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ========= FOOTER ========= */
.landing-footer {
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  padding: 3rem 0 2rem;
  margin-top: 4rem;
}
.footer-content {
  text-align: center;
}
.footer-links {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.footer-links a {
  color: var(--text2);
  text-decoration: none;
  transition: color 0.2s;
}
.footer-links a:hover {
  color: var(--cyan);
}
.footer-tagline {
  color: var(--text2);
  margin-bottom: 1rem;
  font-size: 0.95rem;
}
.license-badge {
  display: inline-block;
  padding: 0.4rem 1rem;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid var(--cyan);
  border-radius: 20px;
  color: var(--cyan);
  font-size: 0.85rem;
  font-weight: 600;
}

/* ========= RESPONSIVE ========= */
@media (max-width: 768px) {
  .nav-links a:not(.nav-github) {
    display: none;
  }
  .section {
    padding: 4rem 0;
  }
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
  .btn {
    width: 100%;
    max-width: 300px;
    text-align: center;
  }
  .comparison {
    grid-template-columns: 1fr;
  }
  .traits-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
