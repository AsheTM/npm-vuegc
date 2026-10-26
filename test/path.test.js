import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { vuegc } = require("../vuegc.js");
const { createVueProject, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

describe("vuegc --path", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("writes the component in src/<path>/", () => {
        fs.mkdirSync(path.join(project, "src", "components"));

        const { status } = runVuegc(project, ["--name", "Hello", "--path", "components"]);

        expect(status).toBe(0);
        expect(readComponent(project, "components/Hello.vue")).toMatch(/id="Hello"/);
        expect(readComponent(project, "Hello.vue")).toBeNull();
    });

    it("creates the missing folders", () => {
        const { status } = runVuegc(project, ["--name", "Button", "--path", "components/ui"]);

        expect(status).toBe(0);
        expect(readComponent(project, "components/ui/Button.vue")).toMatch(/id="Button"/);
    });

    it("still writes in src/ without --path", () => {
        runVuegc(project, ["--name", "Hello"]);

        expect(readComponent(project, "Hello.vue")).not.toBeNull();
    });

    it.each([
        { label: "a parent folder",         value: "../outside" },
        { label: "a hidden parent folder",  value: "components/../../outside" },
        { label: "an absolute path",        value: path.join(path.parse(process.cwd()).root, "outside") },
    ])("rejects $label and writes nothing", ({ value }) => {
        const { status, stdout } = runVuegc(project, ["--name", "Hello", "--path", value]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/must be a folder inside src\//);
        expect(fs.existsSync(path.join(project, "outside"))).toBe(false);
    });

    it("rejects --path without a value", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Hello", "--path"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/must be a folder inside src\//);
    });

    it("accepts a folder name starting with two dots", () => {
        const { status } = runVuegc(project, ["--name", "Hello", "--path", "..shared"]);

        expect(status).toBe(0);
        expect(readComponent(project, "..shared/Hello.vue")).not.toBeNull();
    });
});

describe("vuegc({ path })", () => {
    let project;

    beforeEach(() => {
        project = createVueProject();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
        removeFolder(project);
        vi.restoreAllMocks();
    });

    it("returns the path inside the folder", () => {
        const result = vuegc({ name: "Hello", path: "components", cwd: project });

        expect(result).toBe(path.join(project, "src", "components", "Hello.vue"));
        expect(fs.existsSync(result)).toBe(true);
    });

    it("throws 0x0005 for a folder outside src/", () => {
        let error = null;
        try {
            vuegc({ name: "Hello", path: "../outside", cwd: project });
        } catch(err) {
            error = err;
        }

        expect(error).toMatchObject({ errno: 0x0005, path: "../outside" });
    });
});
