import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { vuegc } = require("../vuegc.js");
const { createVueProject, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

describe("vuegc --ts", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    // The attribute goes through Handlebars: it must not be HTML-escaped (lang&#x3D;&quot;ts&quot;)
    it.each([
        { label: "--ts",            args: ["--ts"],                 tag: '<script setup lang="ts">' },
        { label: "--ts --options",  args: ["--ts", "--options"],    tag: '<script lang="ts">' },
        { label: "--ts false",      args: ["--ts", "false"],        tag: "<script setup>" },
    ])("$label -> $tag", ({ args, tag }) => {
        const { status } = runVuegc(project, ["--name", "Card", ...args]);
        const component = readComponent(project, "Card.vue");

        expect(status).toBe(0);
        expect(component).toContain(tag + "\n");
        expect(component).not.toMatch(/&quot;|&#x3D;/);
    });

    it("declares typed props, optional and unknown", () => {
        runVuegc(project, ["--name", "Card", "--ts", "--props", "title,items"]);

        expect(readComponent(project, "Card.vue")).toContain("const props = defineProps<{\n    title?: unknown;\n    items?: unknown;\n}>();");
    });

    it("declares typed events, quoting names that aren't identifiers", () => {
        runVuegc(project, ["--name", "Card", "--ts", "--emits", "update:modelValue,close"]);

        expect(readComponent(project, "Card.vue")).toContain('const emit = defineEmits<{\n    "update:modelValue": [...args: unknown[]];\n    close: [...args: unknown[]];\n}>();');
    });

    it("uses defineComponent() with --options", () => {
        runVuegc(project, ["--name", "Card", "--ts", "--options"]);
        const component = readComponent(project, "Card.vue");

        expect(component).toContain('import { defineComponent } from "vue";\n\nexport default defineComponent({\n    name: "Card",');
        expect(component).toContain("    methods: { }\n});\n</script>");
    });
});

describe("vuegc({ ts })", () => {
    let project;

    beforeEach(() => {
        project = createVueProject();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
        removeFolder(project);
        vi.restoreAllMocks();
    });

    it.each([
        { label: "setup",           options: {} },
        { label: "setup, blank",    options: { blank: true } },
        { label: "options",         options: { optionsApi: true } },
    ])("matches the snapshot: $label", ({ options }) => {
        const file = vuegc({ name: "Card", ts: true, props: ["title"], emits: ["update:modelValue"], cwd: project, ...options });

        expect(fs.readFileSync(file, "utf-8")).toMatchSnapshot();
    });
});
