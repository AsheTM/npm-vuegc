// Shared tools for the CLI tests: a throwaway Vue 2 project and a way to run vuegc in it
const
    fs              = require("node:fs"),
    os              = require("node:os"),
    path            = require("node:path"),
    { spawnSync }   = require("node:child_process");

const VUEGC = path.join(__dirname, "..", "..", "vuegc.js");

/**
 *  @description    Create a minimal Vue 2 project in a temporary folder
 *  @returns        Path of the project root
 */
function createVueProject() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "vuegc-test-"));
    fs.mkdirSync(path.join(root, "src"));
    fs.writeFileSync(path.join(root, "src", "main.js"), "import Vue from 'vue';\nnew Vue({ render: h => h(App) }).$mount('#app');\n");
    fs.writeFileSync(path.join(root, "src", "App.vue"), "<template><div id=\"app\"></div></template>\n");
    return root;
}

/**
 *  @description    Create an empty folder (not a Vue project)
 */
function createEmptyFolder() {
    return fs.mkdtempSync(path.join(os.tmpdir(), "vuegc-test-"));
}

function removeFolder(folder) {
    fs.rmSync(folder, { recursive: true, force: true });
}

/**
 *  @description    Run the vuegc command in a folder, like a user would
 *  @returns        { status, stdout } exit code and printed text
 */
function runVuegc(cwd, args = []) {
    const result = spawnSync(process.execPath, [VUEGC, ...args], { cwd, encoding: "utf-8" });
    return { status: result.status, stdout: result.stdout + result.stderr };
}

/**
 *  @description    Read a generated component, or null if it doesn't exist
 */
function readComponent(root, fileName) {
    const file = path.join(root, "src", fileName);
    return fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : null;
}

module.exports = { createVueProject, createEmptyFolder, removeFolder, runVuegc, readComponent };
