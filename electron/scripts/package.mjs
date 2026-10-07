// npm run package: writes the application, with its own executable, to dist.

import { packager } from "@electron/packager";

// Only the build output goes into the application. Everything is bundled:
// the sources and node_modules are not needed to run it.
const kept = ["/package.json", "/bin"];

function ignore(file) {
    if (!file)
        return false;
    return !kept.some((entry) => file === entry || file.startsWith(`${entry}/`));
}

const folders = await packager({
    dir: ".",
    out: "dist",
    overwrite: true,
    asar: true,
    ignore,
});

for (const folder of folders)
    console.log(`packaged   ${folder}`);
