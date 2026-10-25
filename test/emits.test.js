import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { vuegc } = require("../vuegc.js");
const { createVueProject, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

describe("vuegc --emits", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("declares the events with defineEmits() in <script setup>", () => {
        const { status } = runVuegc(project, ["--name", "Card", "--emits", "update,close"]);

        expect(status).toBe(0);
        expect(readComponent(project, "Card.vue")).toContain('<script setup>\nconst emit = defineEmits(["update", "close"]);\n</script>');
    });

    it("declares props then events", () => {
        runVuegc(project, ["--name", "Card", "--props", "title", "--emits", "close"]);

        expect(readComponent(project, "Card.vue")).toContain('    title: null\n});\nconst emit = defineEmits(["close"]);\n</script>');
    });

    it("adds emits: [...] after props with --options", () => {
        runVuegc(project, ["--name", "Card", "--options", "--emits", "close"]);

        expect(readComponent(project, "Card.vue")).toContain('    props: { },\n    emits: ["close"],\n    data() {');
    });

    it("accepts v-model events, trims and drops duplicates", () => {
        runVuegc(project, ["--name", "Card", "--emits", " update:modelValue, close,close "]);

        expect(readComponent(project, "Card.vue")).toContain('defineEmits(["update:modelValue", "close"])');
    });

    it("declares nothing without --emits", () => {
        runVuegc(project, ["--name", "Card", "--options"]);

        expect(readComponent(project, "Card.vue")).not.toMatch(/emits|defineEmits/);
    });

    it.each([
        { label: "a digit first",     args: ["--emits", "2bad"],                    message: /Event "2bad" must be a valid event name/ },
        { label: "a space inside",    args: ["--emits", "on close"],                message: /Event "on close" must be a valid event name/ },
        { label: "no value",          args: ["--emits"],                            message: /--emits needs a list of event names/ },
        { label: "--no-script",       args: ["--emits", "close", "--no-script"],    message: /--emits needs the script section/ },
    ])("rejects $label and writes nothing", ({ args, message }) => {
        const { status, stdout } = runVuegc(project, ["--name", "Card", ...args]);

        expect(status).toBe(1);
        expect(stdout).toMatch(message);
        expect(readComponent(project, "Card.vue")).toBeNull();
    });
});

describe("vuegc({ emits })", () => {
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
        { label: "setup",   options: {} },
        { label: "options", options: { optionsApi: true } },
    ])("matches the snapshot: $label", ({ options }) => {
        const file = vuegc({ name: "Card", props: ["title"], emits: ["update:modelValue", "close"], blank: true, cwd: project, ...options });

        expect(fs.readFileSync(file, "utf-8")).toMatchSnapshot();
    });

    it.each([
        { label: "not an array",    emits: "close",                 error: { errno: 0x000B } },
        { label: "invalid name",    emits: ["ok", "not ok"],        error: { errno: 0x000B, event: "not ok" } },
    ])("throws on $label", ({ emits, error }) => {
        let thrown = null;
        try {
            vuegc({ name: "Card", emits, cwd: project });
        } catch(err) {
            thrown = err;
        }

        expect(thrown).toMatchObject(error);
    });
});
