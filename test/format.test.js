import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { vuegc } = require("../vuegc.js");
const { createVueProject, removeFolder } = require("./support/vue-project.js");

describe("generated component format", () => {
    let project;

    beforeEach(() => {
        project = createVueProject();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
        removeFolder(project);
        vi.restoreAllMocks();
    });

    // Snapshots: the first run saves the whole file in __snapshots__/format.test.js.snap,
    // the next runs fail if a single character changes. Update on purpose with: npx vitest run -u
    it.each([
        { label: "default (css, scoped)",  options: {} },
        { label: "--style css",             options: { style: "css" } },
        { label: "--style stylus",          options: { style: "stylus" } },
        { label: "--style less",            options: { style: "less" } },
        { label: "--style sass",            options: { style: "sass" } },
        { label: "--scoped false",          options: { scoped: false } },
        { label: "--blank",                 options: { blank: true } },
        { label: "--options",               options: { optionsApi: true } },
        { label: "--options --props",       options: { optionsApi: true, props: ["title", "items"] } },
        { label: "--props (setup)",         options: { props: ["title", "items"] } },
    ])("matches the snapshot: $label", ({ options }) => {
        const file = vuegc({ name: "HelloWorld", cwd: project, ...options });

        expect(fs.readFileSync(file, "utf-8")).toMatchSnapshot();
    });

    // Rules that must hold for every variant, independently of the snapshots
    it.each([{}, { style: "css" }, { style: "sass" }, { style: "less" }, { style: "stylus" }, { blank: true }, { optionsApi: true }, { props: ["title"] }])("is clean: %o", (options) => {
        const content = fs.readFileSync(vuegc({ name: "HelloWorld", cwd: project, ...options }), "utf-8");

        expect(content).not.toContain("\r");            // LF only (#75)
        expect(content).not.toContain("\t");            // spaces only
        expect(content).not.toMatch(/[ \t]+$/m);        // no trailing whitespace
        expect(content.startsWith("<template>")).toBe(true);
        expect(content.endsWith("</style>\n")).toBe(true);
    });
});
