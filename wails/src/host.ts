// What the interface can ask the Go side (app.go).
//
// To add a function: write an exported method on App in app.go, declare
// it in GoApp and in Host below, and forward it in `host`.

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

// The methods of App, as Wails gives them to the page: same names as in
// Go, each returning a promise. An error returned by Go rejects it.
interface GoApp {
    GetInfo(): Promise<HostInfo>;
    OpenTextFile(): Promise<TextFile | null>;
}

declare global {
    interface Window {
        go: {
            main: {
                App: GoApp;
            };
        };
    }
}

export const host: Host = {
    getInfo: () => window.go.main.App.GetInfo(),
    openTextFile: () => window.go.main.App.OpenTextFile(),
};
