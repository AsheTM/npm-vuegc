import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

// Load vuegc with Node's own require, like another package would (#55)
const require = createRequire(import.meta.url);
const VUEGC = require.resolve("../vuegc.js");
const { vuegc, errorHandler } = require(VUEGC);
const { createVueProject, createEmptyFolder, removeFolder, readComponent } = require("./support/vue-project.js");

// Run a function and return what it threw (vuegc throws plain objects, not Error)
function thrown(fn) {
    try {
        fn();
    } catch(err) {
        return err;
    }
    return null;
}

// Restore every spy/mock after each test
afterEach(() => { vi.restoreAllMocks(); });

describe("require('vuegc')", () => {
    it("exports vuegc() and errorHandler()", () => {
        expect(vuegc).toBeTypeOf("function");
        expect(errorHandler).toBeTypeOf("function");
    });

    it("runs nothing when required: no output, no exit", () => {
        // Spies record calls; mockImplementation stops the real call
        const log  = vi.spyOn(console, "log").mockImplementation(() => {});
        const exit = vi.spyOn(process, "exit").mockImplementation(() => {});

        delete require.cache[VUEGC];   // force a fresh load of the file
        require(VUEGC);

        expect(log).not.toHaveBeenCalled();
        expect(exit).not.toHaveBeenCalled();
    });

    it("doesn't modify String.prototype", () => {
        expect("".toCapitalize).toBeUndefined();
    });
});

describe("vuegc({ ... })", () => {
    let project;

    beforeEach(() => {
        project = createVueProject();
        vi.spyOn(console, "log").mockImplementation(() => {});   // keep the test output clean
    });
    afterEach(() => { removeFolder(project); });

    it("generates the component and returns its path", () => {
        const result = vuegc({ name: "Hello", cwd: project });

        expect(result).toBe(path.join(project, "src", "Hello.vue"));
        expect(fs.existsSync(result)).toBe(true);
        expect(console.log).toHaveBeenCalledWith("> Generating vue component success");
    });

    it("uses scss and scoped by default", () => {
        vuegc({ name: "Hello", cwd: project });

        expect(readComponent(project, "Hello.vue")).toContain('<style lang="scss" scoped>');
    });

    it("applies the style and scoped options", () => {
        vuegc({ name: "Hello", style: "css", scoped: false, cwd: project });

        expect(readComponent(project, "Hello.vue")).toContain('<style lang="css">');
    });

    // Each row: options -> what vuegc() throws
    it.each([
        { label: "missing name",        options: {},                            error: { errno: 0x0003, flag: "name" } },
        { label: "name not a string",   options: { name: true },                error: { errno: 0x0003, flag: "name" } },
        { label: "unsupported style",   options: { name: "Hello", style: "less" }, error: { errno: 0x0004, style: "less" } },
    ])("throws on $label", ({ options, error }) => {
        const err = thrown(() => vuegc({ ...options, cwd: project }));

        expect(err).toMatchObject(error);
        expect(readComponent(project, "Hello.vue")).toBeNull();
    });

    it("throws EEXIST and keeps an existing component", () => {
        const file = path.join(project, "src", "Hello.vue");
        fs.writeFileSync(file, "my own work");

        expect(thrown(() => vuegc({ name: "Hello", cwd: project }))).toMatchObject({ code: "EEXIST" });
        expect(fs.readFileSync(file, "utf-8")).toBe("my own work");
    });

    it("throws ENOENT outside a Vue project", () => {
        const folder = createEmptyFolder();

        expect(thrown(() => vuegc({ name: "Hello", cwd: folder }))).toMatchObject({ code: "ENOENT" });
        removeFolder(folder);
    });
});

describe("errorHandler(err)", () => {
    let log, exit;

    beforeEach(() => {
        log  = vi.spyOn(console, "log").mockImplementation(() => {});
        exit = vi.spyOn(process, "exit").mockImplementation(() => {});
    });

    it.each([
        { label: "missing flag",        err: { errno: 0x0003, flag: "name", exit: true },   message: "Flag name required" },
        { label: "unsupported style",   err: { errno: 0x0004, style: "less", exit: true },  message: "Style less not supported, use one of: css, scss, stylus" },
        { label: "existing component",  err: { code: "EEXIST" },                            message: "Component already exists" },
        { label: "not a Vue project",   err: { code: "ENOENT" },                            message: "It is not the root of Vue project" },
    ])("prints the message and exits with 1 for: $label", ({ err, message }) => {
        errorHandler(err);

        expect(log).toHaveBeenCalledWith(expect.stringContaining(message));
        expect(log).toHaveBeenCalledWith("> Generating vue component failure");
        expect(exit).toHaveBeenCalledWith(1);
    });
});
