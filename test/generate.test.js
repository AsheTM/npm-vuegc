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

    it("uses the name for the root id (and the component name with --options)", () => {
        runVuegc(project, ["--name", "Hello", "--options"]);
        const component = readComponent(project, "Hello.vue");

        expect(component).toMatch(/name: "Hello"/);
        expect(component).toMatch(/<div id="Hello">/);
    });

    it("keeps the case of the name (#15)", () => {
        runVuegc(project, ["--name", "HelloWorld", "--options"]);

        expect(readComponent(project, "HelloWorld.vue")).toMatch(/name: "HelloWorld"/);
    });

    it("capitalizes the first letter of the component name", () => {
        runVuegc(project, ["--name", "helloWorld"]);

        expect(readComponent(project, "helloWorld.vue")).toMatch(/<div id="HelloWorld">/);
    });

    it("accepts a name ending with .vue without repeating it (#16)", () => {
        runVuegc(project, ["--name", "Hello.vue", "--options"]);
        const component = readComponent(project, "Hello.vue");

        expect(component).toMatch(/name: "Hello"/);
        expect(component).not.toMatch(/Hello\.vue/);
    });
});

describe("vuegc script", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("uses <script setup> by default, without a name (Vue 3 takes it from the file name)", () => {
        runVuegc(project, ["--name", "Hello"]);
        const component = readComponent(project, "Hello.vue");

        expect(component).toContain("<script setup>\n</script>");
        expect(component).not.toMatch(/export default|name: /);
    });

    it("--options: Options API, data() returns an object, methods is an object (#17)", () => {
        runVuegc(project, ["--name", "Hello", "--options"]);
        const component = readComponent(project, "Hello.vue");

        expect(component).toMatch(/<script>\nexport default \{\n {4}name: "Hello",/);
        expect(component).toMatch(/data\(\) \{\s*return \{ \};\s*\}/);
        expect(component).toMatch(/methods: \{ \}/);
    });

    it("--options false keeps <script setup>", () => {
        runVuegc(project, ["--name", "Hello", "--options", "false"]);

        expect(readComponent(project, "Hello.vue")).toContain("<script setup>");
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
