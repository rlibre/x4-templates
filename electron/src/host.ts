// What the interface can ask the desktop shell.
//
// Types only: this file is shared by the interface (src) and by the shell
// (desktop), which run in different processes.
//
// To add a function: declare it here, answer it in desktop/main.ts and
// forward it in desktop/preload.ts.

export interface HostInfo {
    name: string;
    version: string;
    runtime: string;
    platform: string;
}

export interface TextFile {
    path: string;
    text: string;
}

export interface Host {
    getInfo(): Promise<HostInfo>;

    /** Asks the user for a text file. Resolves to null when cancelled. */
    openTextFile(): Promise<TextFile | null>;
}

declare global {
    interface Window {
        host: Host;
    }
}
