# x4js desktop application

An [x4js](https://x4js.org) application in an [Electron](https://www.electronjs.org) window.

## Develop

```
npm install
npm run dev
```

`npm run dev` opens the application window. The interface reloads on every change, as it does in a browser. Quitting the application stops the command: close the window or, on macOS where the application outlives its window, press Cmd+Q.

A change in `desktop` is not reloaded: stop the command and run it again.

## Build

```
npm run build
npm start
```

`npm run build` writes the application to `bin`. `npm start` runs that build, without the dev server.

## Package

```
npm run package
```

Builds the application, then writes it with its own executable to `dist`, in a folder named after the application, the system and the processor: `dist/my-app-win32-x64/my-app.exe` on Windows.

That folder is the whole application. Copy or zip it as it is: there is no installer, and the executable does not work without the files next to it.

The name and the version come from `package.json`. The package is made for the system the command runs on.

## How it is organized

| Folder | Runs in | Content |
|---|---|---|
| `src` | The window | The x4js interface. It has no access to the system. |
| `desktop` | Electron | `main.ts` creates the window and answers the interface. `preload.ts` exposes these answers as `window.host`. |
| `public` | | `index.html`, copied to the output. |
| `scripts` | | The code behind `npm run dev` and `npm run package`. |

The two halves are built separately: `x4.config.json` describes the interface (`bin/app`), `x4.desktop.json` the Electron side (`bin/desktop`).

## Calling the system from the interface

The interface cannot read a file or open a system dialog by itself. It asks the Electron side through `window.host`:

```ts
const file = await window.host.openTextFile();
```

To add a function, edit three files:

1. `src/host.ts`: declare it in the `Host` interface.
2. `desktop/main.ts`: answer it with `ipcMain.handle("host:myFunction", ...)`.
3. `desktop/preload.ts`: forward it with `ipcRenderer.invoke("host:myFunction")`.

Values that cross the boundary are copied: pass plain data, not components or functions.

## Links to other sites

The window only ever shows the application. A link or a `window.open` to another site opens in the browser of the system, and the window stays where it is.

This is on purpose: a page loaded in the window receives `window.host`. The rule is in `createWindow`, in `desktop/main.ts`.

## Menu and developer tools

The window has the default menu of Electron, in the packaged application too. It gives access to the developer tools (`View > Toggle Developer Tools`) and to `Reload`.

Both are changed in `desktop/main.ts`. In that file, `devUrl` is only set under `npm run dev`: test it to keep the menu and the tools while developing.

To make the developer tools unavailable, whatever the menu or the shortcut, add `devTools` to the `webPreferences` of the window:

```ts
webPreferences: {
    // ...
    devTools: Boolean(devUrl),
},
```

To remove the menu, with its shortcuts, call `Menu.setApplicationMenu` before the window is created:

```ts
import { Menu } from "electron";

app.whenReady().then(() => {
    if (!devUrl)
        Menu.setApplicationMenu(null);

    createWindow();
    // ...
});
```

On macOS an application without menu loses Cmd+Q and copy and paste. Give it a short menu instead of `null`:

```ts
Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: "appMenu" },
    { role: "editMenu" },
    { role: "windowMenu" },
]));
```

The same function installs a menu of your own: see [Menu](https://www.electronjs.org/docs/latest/api/menu) in the Electron documentation.

## Routes

The built application is loaded from a file, so only the hash URLs of the `Router` work (`#users/12`). This is its default.

`public/index.html` loads `main.js` and `main.css` with relative paths for the same reason. Keep them relative.
