import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

// The support tools are CommonJS: load them with Node's own require
const require = createRequire(import.meta.url);
const { createVueProject, removeFolder, runVuegc } = require("./support/vue-project.js");

describe("vuegc help", () => {
    let project;

    // A fresh Vue project for each test, deleted afterwards
    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    // The same checks for every way of asking for help: one test per row
    it.each([
        { label: "(no argument)",   args: [] },
        { label: "--help",          args: ["--help"] },
        { label: "-h",              args: ["-h"] },
        { label: "-h x",            args: ["-h", "x"] },
        { label: "--help --name",   args: ["--help", "--name"] },
    ])("shows the help for: vuegc $label", ({ args }) => {
        const { status, stdout } = runVuegc(project, args);

        expect(status).toBe(0);
        expect(stdout).toMatch(/vuegc --name HelloWorld\.vue/);
        expect(stdout).toMatch(/Required flag\(s\):/);
    });

    it("doesn't generate anything", () => {
        runVuegc(project, ["--help"]);

        const files = fs.readdirSync(path.join(project, "src"));
        expect(files.sort()).toEqual(["App.vue", "main.js"]);
    });
});
