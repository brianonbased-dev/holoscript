
import { HoloScriptPlusParser } from './src/HoloScriptPlusParser.js';
import { createRuntime } from './src/runtime/HoloScriptPlusRuntime.js';

const parser = new HoloScriptPlusParser();

async function testHotReload() {
  console.log("--- Testing Hot-Reload ---");
  const codeV1 = `
    template Particle() {
      @version(1)
      orb core {
        size: 1.0
        oldProp: "data"
      }
    }
  `;

  const astV1 = {
    type: 'Program',
    body: parser.parse(codeV1),
    root: { type: 'scene', traits: new Map(), directives: [], children: [], properties: {} }
  };

  const runtime = createRuntime(astV1);
  runtime.mount(null);
  
  const templateV1 = astV1.body.find((n) => n.type === 'template');
  runtime.registerTemplate('Particle', templateV1);
  
  const instance = runtime.spawnTemplate('Particle', [0, 0, 0]);
  instance.properties.oldProp = "preserved";

  console.log("Instance spawned v1");

  const codeV2 = `
    template Particle() {
      @version(2)
      orb core {
        size: 2.0
      }
      migrate from(1) {
        renameProperty("oldProp", "newProp")
        props.hotReloaded = true
      }
    }
  `;

  const astV2 = {
    type: 'Program',
    body: parser.parse(codeV2),
    root: astV1.root
  };

  console.log("Calling hotReload...");
  runtime.hotReload(astV2);
  console.log("hotReload completed!");

  console.log("Resulting properties:", JSON.stringify(instance.properties, null, 2));
}

testHotReload().catch(console.error);
