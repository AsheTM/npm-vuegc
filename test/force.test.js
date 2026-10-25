import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { vuegc } = require("../vuegc.js");
const { createVueProject, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

describe("vuegc --force", () => {
    let project, file;

    // Each test starts with an existing, hand-edited component
    beforeEach(() => {
        project = createVueProject();
        file = path.join(project, "src", "Hello.vue");
        fs.writeFileSync(file, "my own work");
    });
    afterEach(() => { removeFolder(project); });

    it.each([
        { label: "--force",         args: ["--force"] },
        { label: "--force true",    args: ["--force", "true"] },
    ])("$label overwrites the component and says so", ({ args }) => {
        const { status, stdout } = runVuegc(project, ["--name", "Hello", ...args]);

        expect(status).toBe(0);
        expect(stdout).toMatch(/Existing component overwritten/);
        expect(readComponent(project, "Hello.vue")).toMatch(/id="Hello"/);
    });

    it.each([
        { label: "(default)",       args: [] },
        { label: "--force false",   args: ["--force", "false"] },
    ])("$label keeps the component and suggests --force", ({ args }) => {
        const { status, stdout } = runVuegc(project, ["--name", "Hello", ...args]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/Component already exists, use --force to overwrite it/);
        expect(fs.readFileSync(file, "utf-8")).toBe("my own work");
    });

    it("applies the new options when overwriting", () => {
        runVuegc(project, ["--name", "Hello", "--force", "--style", "css"]);

        expect(readComponent(project, "Hello.vue")).toContain('<style lang="css" scoped>');
    });

    it("doesn't print the overwrite warning for a new component", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Other", "--force"]);

        expect(status).toBe(0);
        expect(stdout).not.toMatch(/overwritten/);
    });
});

describe("vuegc({ force })", () => {
    let project;

    beforeEach(() => {
        project = createVueProject();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
        removeFolder(project);
        vi.restoreAllMocks();
    });

    it("overwrites with force: true", () => {
        fs.writeFileSync(path.join(project, "src", "Hello.vue"), "my own work");

        vuegc({ name: "Hello", force: true, cwd: project });

        expect(readComponent(project, "Hello.vue")).toMatch(/id="Hello"/);
        expect(console.log).toHaveBeenCalledWith("\t[!] Existing component overwritten [!]");
    });
});
