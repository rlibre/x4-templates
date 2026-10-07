// Main process: creates the window and answers the requests of the interface.

import fs from "node:fs/promises";
import path from "node:path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import type { HostInfo, TextFile } from "../src/host";

// Address of `x4js dev`, set by scripts/dev.mjs. Undefined once built.
const devUrl = process.env.X4_DEV_URL;

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    if (devUrl)
        win.loadURL(devUrl);
    else
        win.loadFile(path.join(__dirname, "../app/index.html"));
}

ipcMain.handle("host:getInfo", (): HostInfo => {
    return {
        name: app.getName(),
        version: app.getVersion(),
        runtime: `Electron ${process.versions.electron}`,
        platform: process.platform,
    };
});

ipcMain.handle("host:openTextFile", async (event): Promise<TextFile | null> => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
        properties: ["openFile"],
    });

    if (result.canceled || !result.filePaths.length)
        return null;

    const filename = result.filePaths[0];
    return {
        path: filename,
        text: await fs.readFile(filename, "utf8"),
    };
});

app.whenReady().then(() => {
    createWindow();

    // macOS: the application stays alive without window, clicking its
    // icon opens a new one.
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        app.quit();
});
