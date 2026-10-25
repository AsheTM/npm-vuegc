import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { vuegc } = require("../vuegc.js");
const { createVueProject, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

// Which sections a generated component contains
function sectionsOf(component) {
    return ["template", "script", "style"].filter((tag) => new RegExp(`^<${ tag }[ >]`, "m").test(component));
}

describe("vuegc --no-template / --no-script / --no-style", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it.each([
        { args: [],                                     expected: ["template", "script", "style"] },
        { args: ["--no-template"],                      expected: ["script", "style"] },
        { args: ["--no-script"],                        expected: ["template", "style"] },
        { args: ["--no-style"],                         expected: ["template", "script"] },
        { args: ["--no-template", "--no-script"],       expected: ["style"] },
        { args: ["--no-template", "--no-style"],        expected: ["script"] },
        { args: ["--no-script", "--no-style"],          expected: ["template"] },
        { args: ["--no-style", "false"],                expected: ["template", "script", "style"] },
    ])("$args -> $expected", ({ args, expected }) => {
        const { status } = runVuegc(project, ["--name", "Hello", ...args]);

        expect(status).toBe(0);
        expect(sectionsOf(readComponent(project, "Hello.vue"))).toEqual(expected);
    });

    it("fails when all three sections are left out, and writes nothing", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Hello", "--no-template", "--no-script", "--no-style"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/A component needs at least one section/);
        expect(readComponent(project, "Hello.vue")).toBeNull();
    });
});

describe("vuegc({ noTemplate, noScript, noStyle })", () => {
    let project;

    beforeEach(() => {
        project = createVueProject();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
        removeFolder(project);
        vi.restoreAllMocks();
    });

    // Snapshots lock the layout: no leading empty line, one empty line between sections
    it.each([
        { label: "no template",         options: { noTemplate: true } },
        { label: "no script",           options: { noScript: true } },
        { label: "no style",            options: { noStyle: true } },
        { label: "template only",       options: { noScript: true, noStyle: true } },
        { label: "script only, blank",  options: { noTemplate: true, noStyle: true, blank: true } },
    ])("matches the snapshot: $label", ({ options }) => {
        const content = fs.readFileSync(vuegc({ name: "HelloWorld", cwd: project, ...options }), "utf-8");

        expect(content).toMatchSnapshot();
        expect(content).not.toMatch(/^\n/);         // no leading empty line
        expect(content).not.toMatch(/\n\n\n/);      // never two empty lines in a row
        expect(content.endsWith(">\n")).toBe(true); // ends right after the last closing tag
    });

    it("throws 0x0006 when all three are left out", () => {
        let error = null;
        try {
            vuegc({ name: "Hello", noTemplate: true, noScript: true, noStyle: true, cwd: project });
        } catch(err) {
            error = err;
        }

        expect(error).toMatchObject({ errno: 0x0006 });
    });
});
