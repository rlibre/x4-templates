// Runs in the window before the interface, with access to Electron.
// The interface itself only sees what is exposed here, as `window.host`.

import { contextBridge, ipcRenderer } from "electron";
import type { Host } from "../src/host";

const host: Host = {
    getInfo: () => ipcRenderer.invoke("host:getInfo"),
    openTextFile: () => ipcRenderer.invoke("host:openTextFile"),
};

contextBridge.exposeInMainWorld("host", host);
