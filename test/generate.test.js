import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createVueProject, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

describe("vuegc --name", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("generates src/<Name>.vue and exits with 0", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Hello"]);

        expect(status).toBe(0);
        expect(stdout).toMatch(/Generating vue component success/);
        expect(readComponent(project, "Hello.vue")).not.toBeNull();
    });

    it("uses the name for the component name and the root id", () => {
        runVuegc(project, ["--name", "Hello"]);
        const component = readComponent(project, "Hello.vue");

        expect(component).toMatch(/name: "Hello"/);
        expect(component).toMatch(/<div id="Hello">/);
    });

    it("keeps the case of the name (#15)", () => {
        runVuegc(project, ["--name", "HelloWorld"]);

        expect(readComponent(project, "HelloWorld.vue")).toMatch(/name: "HelloWorld"/);
    });

    it("capitalizes the first letter of the component name", () => {
        runVuegc(project, ["--name", "helloWorld"]);

        expect(readComponent(project, "helloWorld.vue")).toMatch(/name: "HelloWorld"/);
    });

    it("accepts a name ending with .vue without repeating it (#16)", () => {
        runVuegc(project, ["--name", "Hello.vue"]);
        const component = readComponent(project, "Hello.vue");

        expect(component).toMatch(/name: "Hello"/);
        expect(component).not.toMatch(/Hello\.vue/);
    });

    it("generates a valid Vue 2 script: data() returns an object, methods is an object (#17)", () => {
        runVuegc(project, ["--name", "Hello"]);
        const component = readComponent(project, "Hello.vue");

        expect(component).toMatch(/data\(\) \{\s*return \{ \};\s*\}/);
        expect(component).toMatch(/methods: \{ \}/);
    });
});

describe("vuegc --style", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("uses css by default", () => {
        runVuegc(project, ["--name", "Hello"]);

        expect(readComponent(project, "Hello.vue")).toMatch(/<style lang="css"/);
    });

    it.each(["css", "scss", "sass", "less", "stylus"])("supports --style %s", (style) => {
        const { status } = runVuegc(project, ["--name", "Hello", "--style", style]);

        expect(status).toBe(0);
        expect(readComponent(project, "Hello.vue")).toContain(`<style lang="${ style }"`);
    });
});

describe("vuegc --scoped", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it.each([
        { label: "(default)",       args: [],                   expected: '<style lang="css" scoped>' },
        { label: "--scoped",        args: ["--scoped"],         expected: '<style lang="css" scoped>' },  // flag as last argument (#8)
        { label: "--scoped true",   args: ["--scoped", "true"], expected: '<style lang="css" scoped>' },
        { label: "--scoped false",  args: ["--scoped", "false"],expected: '<style lang="css">' },         // (#12)
    ])("$label -> $expected", ({ args, expected }) => {
        runVuegc(project, ["--name", "Hello", ...args]);

        expect(readComponent(project, "Hello.vue")).toContain(expected);
    });
});
