import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { vuegc } = require("../vuegc.js");
const { createVueProject, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

const HINT = "Tests run with Vitest and Vue Test Utils: npm install -D";

describe("vuegc --test", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("writes a Vitest test next to the component", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--path", "components", "--test"]);

        expect(status).toBe(0);
        expect(stdout).toContain("> Test written: src/components/Card.spec.js");
        expect(readComponent(project, "components/Card.spec.js")).toBe(`import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Card from "./Card.vue";

describe("Card", () => {
    it("renders", () => {
        const wrapper = mount(Card);

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain("Card");
    });
});
`);
        expect(readComponent(project, "components/Card.vue")).not.toBeNull();
    });

    it("writes Card.spec.ts with --ts", () => {
        runVuegc(project, ["--name", "Card", "--test", "--ts"]);

        expect(readComponent(project, "Card.spec.ts")).toContain('import Card from "./Card.vue";');
        expect(readComponent(project, "Card.spec.js")).toBeNull();
    });

    it("mounts the component with its props", () => {
        runVuegc(project, ["--name", "Card", "--test", "--props", "title,items"]);

        expect(readComponent(project, "Card.spec.js")).toContain('const wrapper = mount(Card, { props: { title: "title", items: "items" } });');
    });

    it.each([
        { label: "--blank",         args: ["--blank"] },
        { label: "--no-template",   args: ["--no-template", "--props", "title"] },
    ])("doesn't look for the demo text with $label", ({ args }) => {
        runVuegc(project, ["--name", "Card", "--test", ...args]);
        const test = readComponent(project, "Card.spec.js");

        expect(test).toContain("expect(wrapper.exists()).toBe(true);\n    });");
        expect(test).not.toContain("wrapper.text()");
    });

    // The file keeps the component's name, the import needs a JavaScript name
    it.each([
        { name: "hello-world.vue",  spec: "hello-world.spec.js",    line: 'import HelloWorld from "./hello-world.vue";',    title: 'describe("Hello-world"' },
        { name: "card",             spec: "card.spec.js",           line: 'import Card from "./card.vue";',                 title: 'describe("Card"' },
        { name: "3d-view",          spec: "3d-view.spec.js",        line: 'import _3dView from "./3d-view.vue";',           title: 'describe("3d-view"' },
    ])("names the test after $name", ({ name, spec, line, title }) => {
        runVuegc(project, ["--name", name, "--test"]);
        const test = readComponent(project, spec);

        expect(test).toContain(line);
        expect(test).toContain(title);
    });

    it("doesn't write a test without --test, or with --test false", () => {
        runVuegc(project, ["--name", "Card"]);
        runVuegc(project, ["--name", "Other", "--test", "false"]);

        expect(fs.readdirSync(path.join(project, "src")).filter(file => file.includes(".spec."))).toEqual([]);
    });

    it("writes nothing if the test exists, and names it", () => {
        fs.writeFileSync(path.join(project, "src", "Card.spec.js"), "my own test");
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--test"]);

        expect(status).toBe(1);
        expect(stdout).toContain("src/Card.spec.js already exists, use --force to overwrite it");
        expect(readComponent(project, "Card.vue")).toBeNull();
        expect(readComponent(project, "Card.spec.js")).toBe("my own test");
    });

    it("writes nothing if the component exists", () => {
        fs.writeFileSync(path.join(project, "src", "Card.vue"), "my own work");
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--test"]);

        expect(status).toBe(1);
        expect(stdout).toContain("Component already exists, use --force to overwrite it");
        expect(readComponent(project, "Card.spec.js")).toBeNull();
    });

    it("overwrites the test with --force, and says so", () => {
        fs.writeFileSync(path.join(project, "src", "Card.spec.js"), "my own test");
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--test", "--force"]);

        expect(status).toBe(0);
        expect(stdout).toContain("Existing src/Card.spec.js overwritten");
        expect(stdout).not.toContain("Existing component overwritten");
        expect(readComponent(project, "Card.spec.js")).toContain("mount(Card)");
    });

    it("prints the test with --dry-run, and writes nothing", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--test", "--dry-run"]);

        expect(status).toBe(0);
        expect(stdout).toContain("> Dry run, nothing written: src/Card.vue");
        expect(stdout).toContain("> Dry run, nothing written: src/Card.spec.js\n\nimport { describe, it, expect } from \"vitest\";");
        expect(stdout).not.toContain("Test written");
        expect(fs.readdirSync(path.join(project, "src"))).toEqual(["App.vue", "main.js"]);
    });

    it("refuses --dry-run if the test exists", () => {
        fs.writeFileSync(path.join(project, "src", "Card.spec.js"), "my own test");
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--test", "--dry-run"]);

        expect(status).toBe(1);
        expect(stdout).toContain("src/Card.spec.js already exists");
    });

    it.each([
        { label: "without them",                pkg: { devDependencies: { vite: "^7.0.0" } },                             missing: "vitest @vue/test-utils" },
        { label: "without Vue Test Utils",      pkg: { devDependencies: { vitest: "^4.0.0" } },                           missing: "@vue/test-utils" },
        { label: "with both",                   pkg: { devDependencies: { vitest: "^4.0.0", "@vue/test-utils": "^2" } }, missing: null },
    ])("hints to install Vitest and Vue Test Utils $label", ({ pkg, missing }) => {
        fs.writeFileSync(path.join(project, "package.json"), JSON.stringify(pkg));
        const { stdout } = runVuegc(project, ["--name", "Card", "--test"]);

        if(missing)
            expect(stdout).toContain(`${ HINT } ${ missing } [!]`);
        else
            expect(stdout).not.toContain(HINT);
    });
});

describe("vuegc({ test })", () => {
    let project;

    beforeEach(() => {
        project = createVueProject();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
        removeFolder(project);
        vi.restoreAllMocks();
    });

    it("writes the test and still returns the component's path", () => {
        const file = vuegc({ name: "Card", path: "components", test: true, cwd: project });

        expect(file).toBe(path.join(project, "src", "components", "Card.vue"));
        expect(readComponent(project, "components/Card.spec.js")).toContain("mount(Card)");
    });

    it("throws EEXIST with the test's path when the test exists", () => {
        fs.writeFileSync(path.join(project, "src", "Card.spec.ts"), "my own test");

        expect(() => vuegc({ name: "Card", test: true, ts: true, cwd: project })).toThrow(expect.objectContaining({ code: "EEXIST", file: "src/Card.spec.ts" }));
    });

    it.each([
        { label: "setup, props",    options: { props: ["title"] } },
        { label: "ts, blank",       options: { ts: true, blank: true } },
    ])("matches the snapshot: $label", ({ options }) => {
        vuegc({ name: "Card", test: true, cwd: project, ...options });

        expect(readComponent(project, options.ts ? "Card.spec.ts" : "Card.spec.js")).toMatchSnapshot();
    });
});
