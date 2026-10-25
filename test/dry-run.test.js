import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { vuegc } = require("../vuegc.js");
const { createVueProject, createEmptyFolder, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

describe("vuegc --dry-run", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("prints the target path and the component, and writes nothing", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Hello", "--dry-run"]);

        expect(status).toBe(0);
        expect(stdout).toMatch(/Dry run, nothing written: src\/Hello\.vue/);
        expect(stdout).toMatch(/id="Hello"/);
        expect(readComponent(project, "Hello.vue")).toBeNull();
    });

    it("prints exactly what a real run would write", () => {
        const dry = runVuegc(project, ["--name", "Hello", "--style", "css", "--dry-run"]).stdout;
        runVuegc(project, ["--name", "Hello", "--style", "css"]);

        expect(dry).toContain(readComponent(project, "Hello.vue"));
    });

    it("doesn't create the --path folders", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--path", "components/ui", "--dry-run"]);

        expect(status).toBe(0);
        expect(stdout).toMatch(/src\/components\/ui\/Card\.vue/);
        expect(fs.existsSync(path.join(project, "src", "components"))).toBe(false);
    });

    // A dry run predicts the real run: same errors, same exit code
    it.each([
        { label: "missing --name",      args: ["--dry-run"],                                   message: /Flag name required/ },
        { label: "unsupported style",   args: ["--name", "Hello", "--style", "tailwind", "--dry-run"], message: /Style tailwind not supported/ },
        { label: "path outside src/",   args: ["--name", "Hello", "--path", "..", "--dry-run"],  message: /must be a folder inside src\// },
    ])("fails like a real run: $label", ({ args, message }) => {
        const { status, stdout } = runVuegc(project, args);

        expect(status).toBe(1);
        expect(stdout).toMatch(message);
    });

    it("fails on an existing component, unless --force", () => {
        const file = path.join(project, "src", "Hello.vue");
        fs.writeFileSync(file, "my own work");

        expect(runVuegc(project, ["--name", "Hello", "--dry-run"]).status).toBe(1);
        expect(runVuegc(project, ["--name", "Hello", "--dry-run", "--force"]).status).toBe(0);
        expect(fs.readFileSync(file, "utf-8")).toBe("my own work");
    });

    it("fails outside a Vue project", () => {
        const folder = createEmptyFolder();

        const { status, stdout } = runVuegc(folder, ["--name", "Hello", "--dry-run"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/It is not the root of Vue project/);
        removeFolder(folder);
    });
});

describe("vuegc({ dryRun })", () => {
    let project;

    beforeEach(() => {
        project = createVueProject();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
        removeFolder(project);
        vi.restoreAllMocks();
    });

    it("returns the path without writing the file", () => {
        const result = vuegc({ name: "Hello", path: "components", dryRun: true, cwd: project });

        expect(result).toBe(path.join(project, "src", "components", "Hello.vue"));
        expect(fs.existsSync(result)).toBe(false);
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('id="Hello"'));
    });
});
