/**
 * CLI argument parsing
 */

export interface CLIOptions {
  command: 'parse' | 'run' | 'ast' | 'repl' | 'watch' | 'add' | 'remove' | 'list' | 'help' | 'version';
  input?: string;
  output?: string;
  verbose: boolean;
  json: boolean;
  maxDepth: number;
  timeout: number;
  showAST: boolean;
  packages: string[];
  dev: boolean;
}

const DEFAULT_OPTIONS: CLIOptions = {
  command: 'help',
  verbose: false,
  json: false,
  maxDepth: 10,
  timeout: 5000,
  showAST: false,
  packages: [],
  dev: false,
};

export function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = { ...DEFAULT_OPTIONS };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    // Commands
    if (!arg.startsWith('-')) {
      if (['parse', 'run', 'ast', 'repl', 'watch', 'add', 'remove', 'list', 'help', 'version'].includes(arg)) {
        options.command = arg as CLIOptions['command'];
      } else if (['add', 'remove'].includes(options.command)) {
        // Collect package names for add/remove commands
        options.packages.push(arg);
      } else if (!options.input) {
        options.input = arg;
      }
      i++;
      continue;
    }

    // Flags
    switch (arg) {
      case '-v':
      case '--verbose':
        options.verbose = true;
        break;
      case '-j':
      case '--json':
        options.json = true;
        break;
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '--max-depth':
        options.maxDepth = parseInt(args[++i], 10) || 10;
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i], 10) || 5000;
        break;
      case '--show-ast':
        options.showAST = true;
        break;
      case '-D':
      case '--dev':
        options.dev = true;
        break;
      case '-h':
      case '--help':
        options.command = 'help';
        break;
      case '-V':
      case '--version':
        options.command = 'version';
        break;
    }
    i++;
  }

  return options;
}

export function printHelp(): void {
  console.log(`
HoloScript CLI v1.0.0-alpha.1

Usage: holoscript <command> [options] [input]

Commands:
  parse <file>      Parse a HoloScript file and validate syntax
  run <file>        Execute a HoloScript file
  ast <file>        Output the AST as JSON
  repl              Start interactive REPL mode
  watch <file>      Watch file and re-execute on changes
  add <pkg...>      Add HoloScript packages to current project
  remove <pkg...>   Remove HoloScript packages from current project
  list              List installed HoloScript packages
  help              Show this help message
  version           Show version information

Options:
  -v, --verbose     Enable verbose output
  -j, --json        Output results as JSON
  -o, --output      Write output to file
  --max-depth <n>   Max execution depth (default: 10)
  --timeout <ms>    Execution timeout in ms (default: 5000)
  --show-ast        Show AST during REPL execution
  -D, --dev         Install as dev dependency (for add command)

Examples:
  holoscript parse world.hs
  holoscript run world.hs --verbose
  holoscript ast world.hs -o ast.json
  holoscript repl
  holoscript watch world.hs
  holoscript add @holoscript/std @holoscript/network
  holoscript add @holoscript/test --dev
  holoscript remove @holoscript/network
  holoscript list

Aliases:
  hs              Short alias for holoscript
`);
}
