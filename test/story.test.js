import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { vuegc } = require("../vuegc.js");
const { createVueProject, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

const HINT = "Stories need Storybook, set it up with: npm create storybook@latest";

describe("vuegc --story", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("writes a Storybook story next to the component", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--path", "components", "--story"]);

        expect(status).toBe(0);
        expect(stdout).toContain("> Story written: src/components/Card.stories.js");
        expect(readComponent(project, "components/Card.stories.js")).toBe(`import Card from "./Card.vue";

export default {
    component: Card
};

export const Default = { };
`);
    });

    it("passes the props as args, and a spy for each event", () => {
        runVuegc(project, ["--name", "Card", "--story", "--props", "title", "--emits", "close,item-click,update:modelValue"]);

        expect(readComponent(project, "Card.stories.js")).toBe(`import { fn } from "storybook/test";
import Card from "./Card.vue";

export default {
    component: Card
};

export const Default = {
    args: {
        title: "title",
        onClose: fn(),
        "onItem-click": fn(),
        "onUpdate:modelValue": fn()
    }
};
`);
    });

    it("writes a typed Card.stories.ts with --ts", () => {
        runVuegc(project, ["--name", "Card", "--story", "--ts", "--props", "title"]);

        expect(readComponent(project, "Card.stories.ts")).toBe(`import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Card from "./Card.vue";

const meta = {
    component: Card
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: "title"
    }
};
`);
        expect(readComponent(project, "Card.stories.js")).toBeNull();
    });

    it("names the story after the component, with a JavaScript name for the import", () => {
        runVuegc(project, ["--name", "hello-world.vue", "--story"]);

        expect(readComponent(project, "hello-world.stories.js")).toContain('import HelloWorld from "./hello-world.vue";\n\nexport default {\n    component: HelloWorld\n};');
    });

    it("writes the story and the test together", () => {
        const { stdout } = runVuegc(project, ["--name", "Card", "--story", "--test"]);

        expect(stdout).toContain("> Test written: src/Card.spec.js\n> Story written: src/Card.stories.js");
        expect(fs.readdirSync(path.join(project, "src")).sort()).toEqual(["App.vue", "Card.spec.js", "Card.stories.js", "Card.vue", "main.js"]);
    });

    it("doesn't write a story without --story, or with --story false", () => {
        runVuegc(project, ["--name", "Card"]);
        runVuegc(project, ["--name", "Other", "--story", "false"]);

        expect(fs.readdirSync(path.join(project, "src")).filter(file => file.includes(".stories."))).toEqual([]);
    });

    it("writes nothing if the story exists, and names it", () => {
        fs.writeFileSync(path.join(project, "src", "Card.stories.js"), "my own story");
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--story", "--test"]);

        expect(status).toBe(1);
        expect(stdout).toContain("src/Card.stories.js already exists, use --force to overwrite it");
        expect(fs.readdirSync(path.join(project, "src")).sort()).toEqual(["App.vue", "Card.stories.js", "main.js"]);
        expect(readComponent(project, "Card.stories.js")).toBe("my own story");
    });

    it("overwrites the story with --force, and says so", () => {
        fs.writeFileSync(path.join(project, "src", "Card.stories.js"), "my own story");
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--story", "--force"]);

        expect(status).toBe(0);
        expect(stdout).toContain("Existing src/Card.stories.js overwritten");
        expect(readComponent(project, "Card.stories.js")).toContain("component: Card");
    });

    it("prints the story with --dry-run, and writes nothing", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Card", "--story", "--dry-run"]);

        expect(status).toBe(0);
        expect(stdout).toContain("> Dry run, nothing written: src/Card.stories.js\n\nimport Card from \"./Card.vue\";");
        expect(fs.readdirSync(path.join(project, "src"))).toEqual(["App.vue", "main.js"]);
    });

    it.each([
        { label: "without Storybook",   pkg: { devDependencies: { vite: "^7.0.0" } },         hint: true },
        { label: "with Storybook",      pkg: { devDependencies: { storybook: "^10.0.0" } },   hint: false },
    ])("hints to set up Storybook $label", ({ pkg, hint }) => {
        fs.writeFileSync(path.join(project, "package.json"), JSON.stringify(pkg));
        const { stdout } = runVuegc(project, ["--name", "Card", "--story"]);

        expect(stdout.includes(HINT)).toBe(hint);
    });
});

describe("vuegc({ story })", () => {
    let project;

    beforeEach(() => {
        project = createVueProject();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
        removeFolder(project);
        vi.restoreAllMocks();
    });

    it("writes the story and still returns the component's path", () => {
        const file = vuegc({ name: "Card", story: true, cwd: project });

        expect(file).toBe(path.join(project, "src", "Card.vue"));
        expect(readComponent(project, "Card.stories.js")).toContain("component: Card");
    });

    it("throws EEXIST with the story's path when the story exists", () => {
        fs.writeFileSync(path.join(project, "src", "Card.stories.ts"), "my own story");

        expect(() => vuegc({ name: "Card", story: true, ts: true, cwd: project })).toThrow(expect.objectContaining({ code: "EEXIST", file: "src/Card.stories.ts" }));
    });

    it("matches the snapshot: ts, props and events", () => {
        vuegc({ name: "Card", story: true, ts: true, props: ["title", "items"], emits: ["close", "update:modelValue"], cwd: project });

        expect(readComponent(project, "Card.stories.ts")).toMatchSnapshot();
    });
});
