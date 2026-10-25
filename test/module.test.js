import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { vuegc } = require("../vuegc.js");
const { createVueProject, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

describe("vuegc --module", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("uses <style module> and $style in the template", () => {
        const { status } = runVuegc(project, ["--name", "Card", "--module"]);
        const component = readComponent(project, "Card.vue");

        expect(status).toBe(0);
        expect(component).toContain('<style lang="scss" module>');
        expect(component).toContain('<div :class="$style.root">');
        expect(component).toMatch(/^\.root \{/m);
        expect(component).not.toMatch(/id="Card"|#Card/);
    });

    it.each([
        { label: "(default scoped)",    args: [] },
        { label: "--scoped true",       args: ["--scoped", "true"] },
    ])("replaces scoped: $label", ({ args }) => {
        runVuegc(project, ["--name", "Card", "--module", ...args]);

        expect(readComponent(project, "Card.vue")).not.toMatch(/scoped/);
    });

    it("keeps plain CSS rules local with a .root prefix", () => {
        runVuegc(project, ["--name", "Card", "--module", "--style", "css"]);
        const component = readComponent(project, "Card.vue");

        expect(component).toContain(".root span { font-weight: bold; }");
        expect(component).toContain(".root a { font-style: italic; }");
    });

    it("works with --blank", () => {
        runVuegc(project, ["--name", "Card", "--module", "--blank"]);
        const component = readComponent(project, "Card.vue");

        expect(component).toContain("<div></div>");
        expect(component).toMatch(/<style lang="scss" module>\n<\/style>/);
    });

    it("fails with --no-style: nothing would define $style", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--module", "--no-style"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/--module needs the style section/);
        expect(readComponent(project, "Card.vue")).toBeNull();
    });

    it("--module false keeps scoped", () => {
        runVuegc(project, ["--name", "Card", "--module", "false"]);

        expect(readComponent(project, "Card.vue")).toContain('<style lang="scss" scoped>');
    });
});

describe("vuegc({ cssModule })", () => {
    let project;

    beforeEach(() => {
        project = createVueProject();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
        removeFolder(project);
        vi.restoreAllMocks();
    });

    it.each(["scss", "sass", "css"])("matches the snapshot: %s", (style) => {
        const file = vuegc({ name: "Card", style, cssModule: true, cwd: project });

        expect(fs.readFileSync(file, "utf-8")).toMatchSnapshot();
    });

    it("throws 0x0009 with noStyle", () => {
        let error = null;
        try {
            vuegc({ name: "Card", cssModule: true, noStyle: true, cwd: project });
        } catch(err) {
            error = err;
        }

        expect(error).toMatchObject({ errno: 0x0009 });
    });
});
