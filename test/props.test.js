import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { vuegc } = require("../vuegc.js");
const { createVueProject, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

describe("vuegc --props", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("declares each prop with an open type", () => {
        const { status } = runVuegc(project, ["--name", "Card", "--props", "title,items"]);

        expect(status).toBe(0);
        expect(readComponent(project, "Card.vue")).toContain("    props: {\n        title: null,\n        items: null\n    },");
    });

    it("trims spaces, drops empty items and duplicates", () => {
        runVuegc(project, ["--name", "Card", "--props", " title, items,,title "]);

        expect(readComponent(project, "Card.vue")).toContain("        title: null,\n        items: null\n");
    });

    it.each([
        { label: "no --props",       args: [] },
        { label: "only commas",     args: ["--props", ",,"] },
    ])("keeps props: { } with $label", ({ args }) => {
        runVuegc(project, ["--name", "Card", ...args]);

        expect(readComponent(project, "Card.vue")).toContain("    props: { },");
    });

    it.each([
        { label: "kebab-case",      value: "user-name",     message: /Prop "user-name" must be a valid JavaScript name/ },
        { label: "a digit first",   value: "title,2nd",     message: /Prop "2nd" must be a valid JavaScript name/ },
        { label: "no value",        value: null,            message: /--props needs a list of names/ },
    ])("rejects $label and writes nothing", ({ value, message }) => {
        const args = ["--name", "Card", "--props", ...(value === null ? [] : [value])];

        const { status, stdout } = runVuegc(project, args);

        expect(status).toBe(1);
        expect(stdout).toMatch(message);
        expect(readComponent(project, "Card.vue")).toBeNull();
    });

    it("fails with --no-script instead of ignoring the props", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--props", "title", "--no-script"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/--props needs the script section/);
    });
});

describe("vuegc({ props })", () => {
    let project;

    beforeEach(() => {
        project = createVueProject();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
        removeFolder(project);
        vi.restoreAllMocks();
    });

    it("matches the snapshot", () => {
        const file = vuegc({ name: "Card", props: ["title", "items", "isActive"], blank: true, cwd: project });

        expect(fs.readFileSync(file, "utf-8")).toMatchSnapshot();
    });

    // Each row: props option -> what vuegc() throws
    it.each([
        { label: "not an array",    props: "title",         error: { errno: 0x0007 } },
        { label: "invalid name",    props: ["ok", "no-way"], error: { errno: 0x0007, prop: "no-way" } },
    ])("throws on $label", ({ props, error }) => {
        let thrown = null;
        try {
            vuegc({ name: "Card", props, cwd: project });
        } catch(err) {
            thrown = err;
        }

        expect(thrown).toMatchObject(error);
    });
});
