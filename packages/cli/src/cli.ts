#!/usr/bin/env node
/**
 * HoloScript CLI entry point
 */

import { HoloScriptCLI } from './HoloScriptCLI';
import { parseArgs, printHelp } from './args';
import { startREPL } from './repl';
import { add, remove, list } from './packageManager';
import { TRAITS, formatTrait, formatAllTraits, suggestTraits } from './traits';
import { generateObject, generateScene, listTemplates, getTemplate } from './generator';

const VERSION = '1.0.0-alpha.1';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  switch (options.command) {
    case 'help':
      printHelp();
      process.exit(0);
      break;

    case 'version':
      console.log(`HoloScript CLI v${VERSION}`);
      process.exit(0);
      break;

    case 'repl':
      await startREPL({
        verbose: options.verbose,
        showAST: options.showAST,
      });
      break;

    case 'watch':
      await watchFile(options);
      break;

    case 'add': {
      const success = await add(options.packages, {
        dev: options.dev,
        verbose: options.verbose,
      });
      process.exit(success ? 0 : 1);
      break;
    }

    case 'remove': {
      const success = await remove(options.packages, {
        verbose: options.verbose,
      });
      process.exit(success ? 0 : 1);
      break;
    }

    case 'list':
      list({
        verbose: options.verbose,
        json: options.json,
      });
      process.exit(0);
      break;

    // =========================================
    // NEW: Traits & Generation Commands
    // =========================================

    case 'traits': {
      if (options.input) {
        // Explain specific trait
        const trait = TRAITS[options.input];
        if (trait) {
          console.log('\n' + formatTrait(trait, true) + '\n');
        } else {
          console.error(`\x1b[31mUnknown trait: ${options.input}\x1b[0m`);
          console.log('\nRun \x1b[36mholoscript traits\x1b[0m to see all available traits.');
          process.exit(1);
        }
      } else {
        // List all traits
        console.log(formatAllTraits(options.verbose, options.json));
      }
      process.exit(0);
      break;
    }

    case 'suggest': {
      const description = options.description || options.input;
      if (!description) {
        console.error('\x1b[31mError: No description provided.\x1b[0m');
        console.log('Usage: holoscript suggest "a glowing orb that can be grabbed"');
        process.exit(1);
      }

      const suggested = suggestTraits(description);
      
      if (options.json) {
        console.log(JSON.stringify(suggested, null, 2));
      } else {
        console.log(`\n\x1b[1mSuggested traits for:\x1b[0m "${description}"\n`);
        if (suggested.length === 0) {
          console.log('\x1b[2mNo specific traits suggested. Try adding more descriptive keywords.\x1b[0m');
          console.log('Keywords: grab, throw, glow, click, physics, network, portal, etc.\n');
        } else {
          for (const trait of suggested) {
            console.log(formatTrait(trait, options.verbose));
          }
          console.log('');
        }
      }
      process.exit(0);
      break;
    }

    case 'generate': {
      const description = options.description || options.input;
      if (!description) {
        console.error('\x1b[31mError: No description provided.\x1b[0m');
        console.log('Usage: holoscript generate "a red button that glows when hovered"');
        process.exit(1);
      }

      const result = await generateObject(description, {
        brittneyUrl: options.brittneyUrl,
        verbose: options.verbose,
        timeout: options.timeout,
      });
      
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`\n\x1b[1mGenerated HoloScript\x1b[0m \x1b[2m(${result.source})\x1b[0m\n`);
        console.log('\x1b[36m' + result.code + '\x1b[0m\n');
        if (result.traits.length > 0) {
          console.log(`\x1b[33mTraits used:\x1b[0m ${result.traits.map(t => `@${t}`).join(', ')}\n`);
        }
        if (result.source === 'local') {
          console.log('\x1b[2mTip: Set BRITTNEY_SERVICE_URL for AI-enhanced generation.\x1b[0m\n');
        }
      }
      
      // Write to file if output specified
      if (options.output) {
        const fs = await import('fs');
        fs.writeFileSync(options.output, result.code);
        console.log(`\x1b[32m✓ Written to ${options.output}\x1b[0m\n`);
      }
      
      process.exit(0);
      break;
    }

    case 'templates': {
      const templates = listTemplates();
      
      if (options.json) {
        const details: Record<string, any> = {};
        for (const t of templates) {
          details[t] = getTemplate(t);
        }
        console.log(JSON.stringify(details, null, 2));
      } else {
        console.log('\n\x1b[1mAvailable Object Templates\x1b[0m\n');
        for (const t of templates) {
          const info = getTemplate(t);
          if (info) {
            console.log(`  \x1b[36m${t}\x1b[0m`);
            console.log(`    Traits: ${info.traits.map(tr => `@${tr}`).join(', ')}`);
          }
        }
        console.log('\n\x1b[2mUse: holoscript generate "a <template> called myObject"\x1b[0m\n');
      }
      process.exit(0);
      break;
    }

    default:
      const cli = new HoloScriptCLI(options);
      const exitCode = await cli.run();
      process.exit(exitCode);
  }
}

async function watchFile(options: ReturnType<typeof parseArgs>): Promise<void> {
  if (!options.input) {
    console.error('Error: No input file specified for watch mode.');
    process.exit(1);
  }

  const fs = await import('fs');
  const path = await import('path');
  const { HoloScriptCodeParser, HoloScriptRuntime } = await import('@holoscript/core');

  const filePath = path.resolve(options.input);
  const parser = new HoloScriptCodeParser();
  let runtime = new HoloScriptRuntime();

  console.log(`\x1b[36mWatching ${options.input}...\x1b[0m`);
  console.log('\x1b[2mPress Ctrl+C to stop\x1b[0m\n');

  const executeFile = async () => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parseResult = parser.parse(content);

      if (!parseResult.success) {
        console.log('\x1b[31mParse errors:\x1b[0m');
        parseResult.errors.forEach(err => {
          console.log(`  Line ${err.line}:${err.column}: ${err.message}`);
        });
        return;
      }

      // Reset runtime for fresh execution
      runtime = new HoloScriptRuntime();
      const results = await runtime.executeProgram(parseResult.ast);

      const success = results.every(r => r.success);
      const timestamp = new Date().toLocaleTimeString();

      console.log(`\x1b[2m[${timestamp}]\x1b[0m ${success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} Executed ${results.length} node(s)`);

      if (!success) {
        results.filter(r => !r.success).forEach(r => {
          console.log(`  \x1b[31m${r.error}\x1b[0m`);
        });
      }
    } catch (error) {
      console.log(`\x1b[31mError: ${(error as Error).message}\x1b[0m`);
    }
  };

  // Initial execution
  await executeFile();

  // Watch for changes
  fs.watch(filePath, { persistent: true }, async (eventType) => {
    if (eventType === 'change') {
      console.log('\x1b[2mFile changed, re-executing...\x1b[0m');
      await executeFile();
    }
  });

  // Keep process alive
  await new Promise(() => {});
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
