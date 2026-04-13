# Royal Velvet for Antigravity & VS Code

![Royal Velvet Theme Preview](https://raw.githubusercontent.com/username/royal-velvet-vscode/main/preview.png)

A premium dark Color Theme for Antigravity (and VS Code) inspired by the magnificent [Royal Velvet theme for Obsidian](https://github.com/TfTHacker/obsidian-royal-velvet). It features exquisite deep indigo backgrounds, rich syntax highlighting, and rainbow-themed markdown formatting for a stellar writing and coding experience.

## ✨ Features

- **Rainbow Headings**: Markdown headings (H1 to H6) feature character-by-character interpolation matching the original CSS linear-gradients.
- **Rich Syntax Highlighting**: Perfectly tailored token colors to make code beautiful and legible.
- **Colored Nested Lists**: List markers `-, *, +` are intelligently colored like a rainbow based on their nesting depth.
- **Dynamic Tables**: Striped table rows (darker alternative layers) and colored headers make Markdown tables pop.
- **Blockquote Styling**: Nested blockquotes inherit the rainbow styling of headings for a coherent aesthetic.

## 🎨 Color Palette

| Name           | Hex       | Details |
|----------------|-----------|---------|
| **Background** | `#21212c` | Main dark background layer |
| **Pink**       | `#ff80c0` | Primary accent color, Markdown H1 |
| **Orange**     | `#ffc080` | Link color, Markdown H2 |
| **Yellow**     | `#ffd580` | Strings, Markdown H3 |
| **Green**      | `#a0ff80` | Functions, Markdown H4 |
| **Blue**       | `#80d5ff` | Properties, Markdown H5 |
| **Purple**     | `#9580ff` | Types, Markdown H6 |

## 🛠️ Installation

You can install this theme directly via the VSIX package available in the releases or build it from source:

1. Clone the repository:
   ```bash
   git clone https://github.com/username/royal-velvet-vscode.git
   ```
2. Open the directory in VS Code or Antigravity.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Package the extension:
   ```bash
   npx vsce package
   ```
5. Install the generated `.vsix` file.

## 🤝 Credits

Based heavily on the [Royal Velvet theme for Obsidian](https://github.com/TfTHacker/obsidian-royal-velvet). This conversion faithfully brings the writing experience to code editors with the magic of VS Code's Decoration API allowing true gradients and deep markdown styling.
