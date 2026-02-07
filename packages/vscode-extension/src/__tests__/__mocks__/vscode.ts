/**
 * Mock VS Code API for testing
 */

export enum CompletionItemKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Unit = 10,
  Value = 11,
  Enum = 12,
  Keyword = 13,
  Snippet = 14,
  Color = 15,
  File = 16,
  Reference = 17,
  Folder = 18,
  EnumMember = 19,
  Constant = 20,
  Struct = 21,
  Event = 22,
  Operator = 23,
  TypeParameter = 24,
}

export class MarkdownString {
  value: string = '';
  isTrusted: boolean = false;
  supportHtml: boolean = false;

  constructor(value?: string) {
    if (value) this.value = value;
  }

  appendMarkdown(value: string): this {
    this.value += value;
    return this;
  }

  appendCodeblock(code: string, language?: string): this {
    this.value += '\n```' + (language || '') + '\n' + code + '\n```\n';
    return this;
  }

  appendText(value: string): this {
    this.value += value;
    return this;
  }
}

export class SnippetString {
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class CompletionItem {
  label: string;
  kind?: CompletionItemKind;
  detail?: string;
  documentation?: string | MarkdownString;
  sortText?: string;
  insertText?: string | SnippetString;

  constructor(label: string, kind?: CompletionItemKind) {
    this.label = label;
    this.kind = kind;
  }
}

export class Position {
  line: number;
  character: number;

  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }
}

export class Range {
  start: Position;
  end: Position;

  constructor(startLine: number, startChar: number, endLine: number, endChar: number);
  constructor(start: Position, end: Position);
  constructor(
    startOrStartLine: Position | number,
    endOrStartChar: Position | number,
    endLine?: number,
    endChar?: number
  ) {
    if (typeof startOrStartLine === 'number') {
      this.start = new Position(startOrStartLine, endOrStartChar as number);
      this.end = new Position(endLine!, endChar!);
    } else {
      this.start = startOrStartLine;
      this.end = endOrStartChar as Position;
    }
  }
}

export class Hover {
  contents: MarkdownString | MarkdownString[];
  range?: Range;

  constructor(contents: MarkdownString | MarkdownString[], range?: Range) {
    this.contents = contents;
    this.range = range;
  }
}

export interface TextDocument {
  getText(range?: Range): string;
  getWordRangeAtPosition(position: Position, regex?: RegExp): Range | undefined;
  lineAt(line: number): { text: string };
}

export interface CancellationToken {
  isCancellationRequested: boolean;
  onCancellationRequested: unknown;
}

export interface CompletionContext {
  triggerKind: number;
  triggerCharacter?: string;
}

export const workspace = {
  getConfiguration: () => ({
    get: () => undefined,
  }),
};

export const window = {
  showInformationMessage: () => Promise.resolve(),
  showErrorMessage: () => Promise.resolve(),
};

export class SemanticTokensBuilder {
  tokens: Array<{ line: number; char: number; length: number; type: number; modifiers: number }> =
    [];

  push(line: number, char: number, length: number, type: number, modifiers: number = 0): void {
    this.tokens.push({ line, char, length, type, modifiers });
  }

  build(): { data: number[] } {
    return { data: [] };
  }
}

export class SemanticTokensLegend {
  tokenTypes: string[];
  tokenModifiers: string[];

  constructor(tokenTypes: string[], tokenModifiers: string[] = []) {
    this.tokenTypes = tokenTypes;
    this.tokenModifiers = tokenModifiers;
  }
}

export class SemanticTokens {
  data: Uint32Array;

  constructor(data: Uint32Array) {
    this.data = data;
  }
}

export default {
  CompletionItemKind,
  MarkdownString,
  SnippetString,
  CompletionItem,
  Position,
  Range,
  Hover,
  workspace,
  window,
  SemanticTokensBuilder,
  SemanticTokensLegend,
  SemanticTokens,
};
