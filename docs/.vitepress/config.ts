import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'HoloScript',
  description: 'The spatial programming language for VR, AR, and 3D applications',

  // Ignore dead links for now - many docs reference planned pages
  ignoreDeadLinks: true,

  // Exclude knowledge files that contain Vue-incompatible syntax
  srcExclude: ['knowledge/**'],

  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#00ffff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://www.holoscript.net' }],
    [
      'meta',
      { property: 'og:title', content: 'HoloScript - Create VR Worlds Without the Complexity' },
    ],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'Open-source declarative language for building VR/AR experiences. 56 built-in traits, deploy to 9 platforms from a single source.',
      },
    ],
    ['meta', { property: 'og:image', content: 'https://www.holoscript.net/og-image.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@holoscript' }],
    [
      'meta',
      { name: 'twitter:title', content: 'HoloScript - Create VR Worlds Without the Complexity' },
    ],
    [
      'meta',
      {
        name: 'twitter:description',
        content:
          'Open-source declarative language for building VR/AR experiences. 56 built-in traits, deploy to 9 platforms.',
      },
    ],
    ['meta', { name: 'twitter:image', content: 'https://www.holoscript.net/og-image.png' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guides/' },
      { text: 'Reference', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
      {
        text: 'Tools',
        items: [
          {
            text: 'VS Code Extension',
            link: 'https://marketplace.visualstudio.com/items?itemName=holoscript.holoscript-vscode',
          },
          { text: 'MCP Server', link: '/guides/mcp-server' },
          { text: 'Playground', link: 'https://holoscript.studio' },
        ],
      },
    ],

    sidebar: {
      '/guides/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guides/' },
            { text: 'Quick Start', link: '/guides/quick-start' },
            { text: 'Installation', link: '/guides/installation' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'File Formats', link: '/guides/file-formats' },
            { text: 'Objects & Orbs', link: '/guides/objects' },
            { text: 'VR Traits', link: '/guides/traits' },
            { text: 'Compositions', link: '/guides/compositions' },
          ],
        },
        {
          text: 'Integration',
          items: [
            { text: 'VS Code', link: '/guides/vscode' },
            { text: 'MCP Server', link: '/guides/mcp-server' },
            { text: 'AI Agents', link: '/guides/ai-agents' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'Reference',
          items: [
            { text: 'Syntax', link: '/api/' },
            { text: 'Traits', link: '/api/traits' },
            { text: 'Functions', link: '/api/functions' },
            { text: 'Limits', link: '/api/limits' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Hello World', link: '/examples/hello-world' },
            { text: 'Arena Game', link: '/examples/arena-game' },
            { text: 'World Builder', link: '/examples/world-builder' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/brianonbased-dev/Holoscript' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-2026 Hololand',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/brianonbased-dev/Holoscript/edit/master/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
});
