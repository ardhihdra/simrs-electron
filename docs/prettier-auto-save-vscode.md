# Prettier Auto Save Setup (VSCode)

The `.vscode/settings.json` in this repo already configures format-on-save with Prettier.
You just need to install the extension.

## Steps

1. Open VSCode
2. Go to Extensions (`Cmd+Shift+X` on Mac / `Ctrl+Shift+X` on Windows)
3. Search for **Prettier - Code formatter**
4. Install the extension by **Prettier** (publisher: `esbenp`)

That's it. VSCode will now auto-format your files on save using the project's `.prettierrc.yaml` config.

## What gets formatted automatically

- TypeScript (`.ts`)
- TypeScript React (`.tsx`)
- JavaScript (`.js`)
- JavaScript React (`.jsx`)
- JSON (`.json`)

## Prettier config (`.prettierrc.yaml`)

```yaml
singleQuote: true
semi: false
printWidth: 100
trailingComma: none
```