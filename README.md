# electron-start

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

we have simrs-types repository, for development, you can use yalc (https://www.npmjs.com/package/yalc) to use local repo for npm

## Changing the App Title and Icon

### App Title

Update the title in these three places:

1. **`src/renderer/index.html`** — browser tab/window title:
   ```html
   <title>SIMRS ABION</title>
   ```

2. **`src/main/index.ts`** — native window title bar:
   ```ts
   const mainWindow = new BrowserWindow({
     title: 'SIMRS ABION',
     ...
   })
   ```

3. **`electron-builder.yml`** — installer/packaged app name:
   ```yaml
   productName: SIMRS ABION
   ```

### App Icon

Replace the file at **`resources/icon.png`** with your desired icon (PNG, minimum 512×512px recommended).

The icon is automatically used for:
- Windows & Linux: window icon and taskbar
- macOS: dock icon (set via `app.dock.setIcon()` in `src/main/index.ts`)
- Built installer/package (via `electron-builder`)