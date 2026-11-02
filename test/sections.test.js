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

    // Without a template, the script has something in it: Vue drops an empty <script setup> (#120)
    it.each([
        { args: [],                                                     expected: ["template", "script", "style"] },
        { args: ["--no-template", "--props", "title"],                  expected: ["script", "style"] },
        { args: ["--no-template", "--emits", "close"],                  expected: ["script", "style"] },
        { args: ["--no-template", "--options"],                         expected: ["script", "style"] },
        { args: ["--no-script"],                                        expected: ["template", "style"] },
        { args: ["--no-style"],                                         expected: ["template", "script"] },
        { args: ["--no-template", "--no-style", "--props", "title"],    expected: ["script"] },
        { args: ["--no-script", "--no-style"],                          expected: ["template"] },
        { args: ["--no-style", "false"],                                expected: ["template", "script", "style"] },
        { args: ["--no-template", "false"],                             expected: ["template", "script", "style"] },
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

    // These components don't compile: "At least one <template> or <script> is required" (#120)
    it.each([
        { args: ["--no-template"],                  message: "Without the template, the script needs content: add --props, --emits or --options, or keep the template" },
        { args: ["--no-template", "--no-style"],    message: "Without the template, the script needs content" },
        { args: ["--no-template", "--ts"],          message: "Without the template, the script needs content" },
        { args: ["--no-template", "--no-script"],   message: "A component needs a template or a script: don't use --no-template with --no-script" },
    ])("refuses $args, and writes nothing", ({ args, message }) => {
        const { status, stdout } = runVuegc(project, ["--name", "Hello", ...args]);

        expect(status).toBe(1);
        expect(stdout).toContain(message);
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
        { label: "no template",         options: { noTemplate: true, props: ["title"] } },
        { label: "no script",           options: { noScript: true } },
        { label: "no style",            options: { noStyle: true } },
        { label: "template only",       options: { noScript: true, noStyle: true } },
        { label: "script only, blank",  options: { noTemplate: true, noStyle: true, blank: true, optionsApi: true } },
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

    it.each([
        { label: "an empty <script setup>",    options: { noTemplate: true },                   noScript: false },
        { label: "no script",                   options: { noTemplate: true, noScript: true },   noScript: true },
    ])("throws 0x000F without the template and $label", ({ options, noScript }) => {
        expect(() => vuegc({ name: "Hello", cwd: project, ...options })).toThrow(expect.objectContaining({ errno: 0x000F, noScript }));
        expect(readComponent(project, "Hello.vue")).toBeNull();
    });
});
