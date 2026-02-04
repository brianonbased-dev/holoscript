import { describe, it, expect } from 'vitest';
import { HoloCompositionParser } from '../parser/HoloCompositionParser';

describe('UI Components', () => {
  const parser = new HoloCompositionParser();

  describe('UI Panel', () => {
    it('should parse ui_panel with basic properties', () => {
      const code = `
        composition "UITest" {
          ui_panel "Settings" {
            position: [0, 1.5, -2]
            width: 400
            height: 300
          }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.ast!.objects.length).toBeGreaterThan(0);
    });

    it('should parse ui_panel with nested ui_text', () => {
      const code = `
        composition "NestedUI" {
          ui_panel "Header" {
            position: [0, 2, -1]

            ui_text "Title" {
              content: "Welcome"
              fontSize: 24
            }
          }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });

  describe('UI Button', () => {
    it('should parse ui_button with properties', () => {
      const code = `
        composition "ButtonTest" {
          ui_button "Submit" {
            text: "Click Me"
            position: [0, 1, -1]
          }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse ui_button with trait', () => {
      const code = `
        composition "InteractiveButton" {
          ui_button "Action" {
            text: "Press"
            @hoverable
          }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });

  describe('UI Slider', () => {
    it('should parse ui_slider with min/max', () => {
      const code = `
        composition "SliderTest" {
          ui_slider "Volume" {
            min: 0
            max: 100
            value: 50
            position: [0, 1, -1]
          }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });

  describe('UI Input', () => {
    it('should parse ui_input field', () => {
      const code = `
        composition "InputTest" {
          ui_input "Username" {
            placeholder: "Enter name..."
            position: [0, 1, -1]
          }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });

  describe('UI Image', () => {
    it('should parse ui_image with src', () => {
      const code = `
        composition "ImageTest" {
          ui_image "Logo" {
            src: "images/logo.png"
            width: 200
            height: 100
            position: [0, 2, -1]
          }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });

  describe('Complex UI Layout', () => {
    it('should parse nested UI hierarchy', () => {
      const code = `
        composition "Dashboard" {
          ui_panel "MainPanel" {
            position: [0, 1.5, -2]
            width: 800
            height: 600

            ui_text "Title" {
              content: "Dashboard"
              fontSize: 32
            }

            ui_panel "Controls" {
              position: [0, -1, 0]

              ui_slider "Brightness" {
                min: 0
                max: 100
                value: 75
              }

              ui_button "Apply" {
                text: "Apply Settings"
              }
            }

            ui_chart "Stats" {
              type: "bar"
              data: [10, 20, 30, 40]
            }
          }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });

    it('should parse ui_panel with traits', () => {
      const code = `
        composition "FloatingUI" {
          ui_panel "HUD" {
            position: [0, 1.5, -1.5]
            @ui_floating(follow_delay: 0.3)
            @ui_anchored(to: "head")

            ui_text "Info" {
              content: "Health: 100"
            }
          }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });

  describe('UI in Objects', () => {
    it('should parse ui components inside regular objects', () => {
      const code = `
        composition "ObjectWithUI" {
          object "Terminal" {
            geometry: "cube"
            scale: [0.5, 0.3, 0.1]
            position: [0, 1, 0]

            ui_panel "Screen" {
              position: [0, 0.15, 0.06]

              ui_text "Output" {
                content: "> Ready..."
                fontSize: 14
              }
            }
          }
        }
      `;
      const result = parser.parse(code);
      expect(result.success).toBe(true);
    });
  });
});
