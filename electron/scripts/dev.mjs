// npm run dev: builds the desktop shell, starts `x4js dev`, then opens
// Electron on the dev server. Closing the window stops everything.

import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const root = process.cwd();
const require = createRequire(path.join(root, "package.json"));

// Run with the current node, without a shell: a child started through a
// shell is not stopped with it on Windows and keeps the port busy.
const x4js = path.join(root, "node_modules", "x4js", "bin", "x4js.mjs");

// From node, the electron package is the path of its executable.
const electron = require("electron");

function readDevAddress() {
    const config = JSON.parse(fs.readFileSync(path.join(root, "x4.config.json"), "utf8"));
    const host = config.dev?.host ?? "127.0.0.1";
    const port = config.dev?.port;
    if (!port)
        throw new Error("x4.config.json must set dev.port: Electron needs to know where to connect");
    return { host, port };
}

function waitForServer(host, port, timeout = 30000) {
    const deadline = Date.now() + timeout;

    return new Promise((resolve, reject) => {
        function attempt() {
            const socket = net.connect(port, host);

            socket.once("connect", () => {
                socket.destroy();
                resolve();
            });

            socket.once("error", () => {
                socket.destroy();
                if (Date.now() > deadline)
                    reject(new Error(`Dev server not reachable on ${host}:${port}`));
                else
                    setTimeout(attempt, 150);
            });
        }

        attempt();
    });
}

const { host, port } = readDevAddress();

const built = spawnSync(process.execPath, [x4js, "build", "--debug", "--config", "x4.desktop.json"], {
    cwd: root,
    stdio: "inherit",
});
if (built.status !== 0)
    process.exit(built.status ?? 1);

const server = spawn(process.execPath, [x4js, "dev"], {
    cwd: root,
    stdio: "inherit",
});

let desktop;

function stop(code) {
    server.kill();
    desktop?.kill();
    process.exit(code);
}

server.once("exit", (code) => stop(code ?? 1));
process.once("SIGINT", () => stop(0));
process.once("SIGTERM", () => stop(0));

try {
    await waitForServer(host, port);
}
catch (error) {
    console.error(error.message);
    stop(1);
}

desktop = spawn(electron, ["."], {
    cwd: root,
    stdio: "inherit",
    env: {
        ...process.env,
        X4_DEV_URL: `http://${host}:${port}`,
    },
});

desktop.once("exit", (code) => stop(code ?? 0));
