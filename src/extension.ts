import * as vscode from 'vscode';

/**
 * Royal Velvet Markdown Decorator
 * - Rainbow gradient headings (character-by-character interpolation)
 * - Colored nested list markers
 * - Colored table elements
 * - Colored blockquote markers
 */

// === Theme Colors ===
const COLORS = {
  pink:       '#ff80c0',
  orange:     '#ffc080',
  yellow:     '#ffd580',
  green:      '#a0ff80',
  blue:       '#80d5ff',
  purple:     '#9580ff',
  purplePink: '#df80ff',
  red:        '#ff8080',
  text:       '#f8f8f2',
  textMuted:  '#f8f8f280',
  layer3:     '#414358',
  layer4:     '#50536d',
};

// Heading gradients: [startColor, endColor] (matching original theme.css)
const HEADING_GRADIENTS: [string, string][] = [
  [COLORS.pink,   COLORS.orange], // H1: pink → orange
  [COLORS.orange, COLORS.yellow], // H2: orange → yellow
  [COLORS.yellow, COLORS.green],  // H3: yellow → green
  [COLORS.green,  COLORS.blue],   // H4: green → blue
  [COLORS.blue,   COLORS.purple], // H5: blue → purple
  [COLORS.purple, COLORS.pink],   // H6: purple → pink
];

const RAINBOW = [COLORS.pink, COLORS.orange, COLORS.yellow, COLORS.green, COLORS.blue, COLORS.purple];

// === Color Utilities ===
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function interpolateColor(color1: string, color2: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  return rgbToHex(
    r1 + (r2 - r1) * ratio,
    g1 + (g2 - g1) * ratio,
    b1 + (b2 - b1) * ratio,
  );
}

// === Gradient Decoration Cache ===
const GRADIENT_STEPS = 20;
const gradientDecorationCache: Map<string, vscode.TextEditorDecorationType> = new Map();

function getGradientDecorationType(color: string, bold: boolean): vscode.TextEditorDecorationType {
  const key = `${color}-${bold}`;
  let decType = gradientDecorationCache.get(key);
  if (!decType) {
    decType = vscode.window.createTextEditorDecorationType({
      color: color,
      fontWeight: bold ? 'bold' : undefined,
    });
    gradientDecorationCache.set(key, decType);
  }
  return decType;
}

// === Table Decoration Types ===
let tablePipeDecType: vscode.TextEditorDecorationType;
let tableDashDecType: vscode.TextEditorDecorationType;
let tableHeaderDecType: vscode.TextEditorDecorationType;
let tableRowOddDecType: vscode.TextEditorDecorationType;
let tableRowEvenDecType: vscode.TextEditorDecorationType;
let tableBorderDecType: vscode.TextEditorDecorationType;

// === List Decoration Types ===
let listDecorationTypes: vscode.TextEditorDecorationType[] = [];

// === Blockquote Decoration Types ===
let bqDecorationTypes: vscode.TextEditorDecorationType[] = [];

function createStaticDecorations() {
  // Table decorations
  tablePipeDecType = vscode.window.createTextEditorDecorationType({
    color: COLORS.purple + '80', // semi-transparent purple for pipes
    fontWeight: 'bold'
  });
  tableDashDecType = vscode.window.createTextEditorDecorationType({
    color: COLORS.layer4,
  });
  tableHeaderDecType = vscode.window.createTextEditorDecorationType({
    backgroundColor: '#9580ff25', // subtle purple tint
    after: {
      contentText: '',
      border: `1px solid ${COLORS.layer4}`,
    },
    fontWeight: 'bold',
  });
  tableRowOddDecType = vscode.window.createTextEditorDecorationType({
    backgroundColor: '#21212c', // matching editor background or slightly darker
  });
  tableRowEvenDecType = vscode.window.createTextEditorDecorationType({
    backgroundColor: '#272835', // layer-1
  });
  tableBorderDecType = vscode.window.createTextEditorDecorationType({
    outline: `1px solid ${COLORS.layer4}40`,
  });

  // List marker decorations (one per rainbow color)
  listDecorationTypes = RAINBOW.map(color =>
    vscode.window.createTextEditorDecorationType({
      color: color,
      fontWeight: 'bold',
    })
  );

  // Blockquote marker decorations
  bqDecorationTypes = RAINBOW.map(color =>
    vscode.window.createTextEditorDecorationType({
      color: color,
    })
  );
}

// === Main Decoration Logic ===
function updateDecorations(editor: vscode.TextEditor) {
  if (editor.document.languageId !== 'markdown') {
    return;
  }

  const doc = editor.document;

  // Collect decorations for gradient headings
  const gradientDecorations: Map<vscode.TextEditorDecorationType, vscode.DecorationOptions[]> = new Map();

  // Collect decorations for static types
  const tablePipeDecos: vscode.DecorationOptions[] = [];
  const tableDashDecos: vscode.DecorationOptions[] = [];
  const tableHeaderDecos: vscode.DecorationOptions[] = [];
  const tableRowOddDecos: vscode.DecorationOptions[] = [];
  const tableRowEvenDecos: vscode.DecorationOptions[] = [];
  const tableBorderDecos: vscode.DecorationOptions[] = [];
  
  const listDecos: vscode.DecorationOptions[][] = RAINBOW.map(() => []);
  const bqDecos: vscode.DecorationOptions[][] = RAINBOW.map(() => []);

  // Track if we're in a table
  let inTable = false;
  let isHeaderRow = false;
  let tableLineCount = 0;
  let tableDataRowCount = 0;

  for (let i = 0; i < doc.lineCount; i++) {
    const line = doc.lineAt(i);
    const text = line.text;

    // === HEADINGS with gradient ===
    const headingMatch = text.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch && !text.includes('|')) {
      const level = headingMatch[1].length; // 1-6
      const markerEnd = headingMatch[1].length;
      const textStart = markerEnd + 1;
      const headingText = headingMatch[2];
      const [startColor, endColor] = HEADING_GRADIENTS[level - 1];

      // Color the # markers with the start color
      const markerDecType = getGradientDecorationType(startColor, true);
      if (!gradientDecorations.has(markerDecType)) {
        gradientDecorations.set(markerDecType, []);
      }
      gradientDecorations.get(markerDecType)!.push({
        range: new vscode.Range(i, 0, i, markerEnd),
      });

      // Apply gradient to each character of heading text
      const textLen = headingText.length;
      if (textLen > 0) {
        for (let c = 0; c < textLen; c++) {
          const ratio = textLen === 1 ? 0 : c / (textLen - 1);
          const color = interpolateColor(startColor, endColor, ratio);
          const decType = getGradientDecorationType(color, true);
          if (!gradientDecorations.has(decType)) {
            gradientDecorations.set(decType, []);
          }
          gradientDecorations.get(decType)!.push({
            range: new vscode.Range(i, textStart + c, i, textStart + c + 1),
          });
        }
      }
      inTable = false;
      tableLineCount = 0;
      tableDataRowCount = 0;
      continue;
    }

    // === TABLES ===
    // More robust table line detection
    const isTableLine = /^\s*\|/.test(text) || (inTable && /\|/.test(text));

    if (isTableLine) {
      if (!inTable) {
        inTable = true;
        isHeaderRow = true;
        tableLineCount = 0;
        tableDataRowCount = 0;
      }
      tableLineCount++;

      const firstPipe = text.indexOf('|');
      const lastPipe = text.lastIndexOf('|');
      const tableRange = new vscode.Range(i, firstPipe, i, lastPipe + 1);

      // Check if this is a separator row (|---|---|)
      const isSeparator = /^\s*\|[\s\-:|]+\|?\s*$/.test(text);

      if (isSeparator) {
        // Color separator dashes
        for (let c = 0; c < text.length; c++) {
          if (text[c] === '|') {
            tablePipeDecos.push({ range: new vscode.Range(i, c, i, c + 1) });
          } else if (text[c] === '-' || text[c] === ':') {
            tableDashDecos.push({ range: new vscode.Range(i, c, i, c + 1) });
          }
        }
        isHeaderRow = false;
      } else {
        // Color pipes in data/header rows
        for (let c = 0; c < text.length; c++) {
          if (text[c] === '|') {
            tablePipeDecos.push({ range: new vscode.Range(i, c, i, c + 1) });
          }
        }

        // Apply background and borders to the exact table range
        tableBorderDecos.push({ range: tableRange });
        if (tableLineCount === 1) {
          tableHeaderDecos.push({ range: tableRange });
        } else {
          // Data row
          tableDataRowCount++;
          if (tableDataRowCount % 2 === 1) {
             tableRowOddDecos.push({ range: tableRange });
          } else {
             tableRowEvenDecos.push({ range: tableRange });
          }
        }
      }
      continue;
    } else {
      inTable = false;
      tableLineCount = 0;
      tableDataRowCount = 0;
    }

    // === LISTS ===
    const listMatch = text.match(/^(\s*)([-*+]|\d+\.)\s/);
    if (listMatch) {
      const indentLength = listMatch[1].length;
      let level: number;
      if (listMatch[1].includes('\t')) {
        level = (listMatch[1].match(/\t/g) || []).length;
      } else {
        level = Math.floor(indentLength / 2);
      }
      const colorIndex = level % RAINBOW.length;
      const markerStart = indentLength;
      const markerEnd = indentLength + listMatch[2].length;
      listDecos[colorIndex].push({
        range: new vscode.Range(i, markerStart, i, markerEnd),
      });
    }

    // === BLOCKQUOTES ===
    const bqMatch = text.match(/^(\s*)((?:>\s*)+)/);
    if (bqMatch) {
      const markers = bqMatch[2];
      let pos = bqMatch[1].length;
      let depth = 0;
      for (let j = 0; j < markers.length; j++) {
        if (markers[j] === '>') {
          const colorIndex = depth % RAINBOW.length;
          bqDecos[colorIndex].push({
            range: new vscode.Range(i, pos + j, i, pos + j + 1),
          });
          depth++;
        }
      }
    }
  }

  // Apply gradient decorations
  gradientDecorations.forEach((decos, decType) => {
    editor.setDecorations(decType, decos);
  });

  // Apply table decorations
  editor.setDecorations(tablePipeDecType, tablePipeDecos);
  editor.setDecorations(tableDashDecType, tableDashDecos);
  editor.setDecorations(tableHeaderDecType, tableHeaderDecos);
  editor.setDecorations(tableRowOddDecType, tableRowOddDecos);
  editor.setDecorations(tableRowEvenDecType, tableRowEvenDecos);
  editor.setDecorations(tableBorderDecType, tableBorderDecos);

  // Apply list decorations
  listDecorationTypes.forEach((type, idx) => {
    editor.setDecorations(type, listDecos[idx]);
  });

  // Apply blockquote decorations
  bqDecorationTypes.forEach((type, idx) => {
    editor.setDecorations(type, bqDecos[idx]);
  });
}

// === Extension Lifecycle ===
export function activate(context: vscode.ExtensionContext) {
  createStaticDecorations();

  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    updateDecorations(activeEditor);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) { updateDecorations(editor); }
    }),
    vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) {
        updateDecorations(editor);
      }
    }),
    vscode.window.onDidChangeActiveColorTheme(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor) { updateDecorations(editor); }
    })
  );
}

export function deactivate() {
  gradientDecorationCache.forEach(d => d.dispose());
  gradientDecorationCache.clear();
  tablePipeDecType?.dispose();
  tableDashDecType?.dispose();
  tableHeaderDecType?.dispose();
  tableRowOddDecType?.dispose();
  tableRowEvenDecType?.dispose();
  tableBorderDecType?.dispose();
  listDecorationTypes.forEach(d => d.dispose());
  bqDecorationTypes.forEach(d => d.dispose());
}
