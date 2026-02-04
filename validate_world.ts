import { HoloScriptPlusParser } from './packages/core/src/parser/HoloScriptPlusParser';
import * as fs from 'fs';
import * as path from 'path';

async function validate() {
    const worldPath = path.resolve('c:/Users/josep/Documents/GitHub/Hololand/examples/hololand-central/src/worlds/hololand_planet.holo');
    const source = fs.readFileSync(worldPath, 'utf8');
    
    console.log('--- Validating hololand_planet.holo ---');
    const parser = new HoloScriptPlusParser({
        enableVRTraits: true,
        enableInterpolation: true
    });
    
    const result = parser.parse(source);
    
    if (result.errors.length > 0) {
        console.error('❌ Validation Failed with errors:');
        result.errors.forEach(err => {
            console.error(`- [${err.line}:${err.column}] ${err.message}`);
        });
    } else {
        console.log('✅ Validation Successful!');
        console.log('AST Structure Overview:');
        const root = result.ast.root;
        console.log(`Type: ${root.type}`);
        console.log(`Name: ${root.name}`);
        
        if (root.body) {
            console.log(`Systems: ${root.body.systems?.length || 0}`);
            console.log(`Configs: ${root.body.configs?.length || 0}`);
            console.log(`Children: ${root.body.children?.length || 0}`);
            
            // Log details of narrative nodes
            const narratives = root.body.children.filter(c => c.type === 'narrative');
            console.log(`Narrative Blocks: ${narratives.length}`);
            narratives.forEach(n => {
                console.log(`  - Narrative ID: ${n.id}`);
            });
        }
    }
}

validate().catch(console.error);
