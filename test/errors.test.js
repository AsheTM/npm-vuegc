import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { createVueProject, createEmptyFolder, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

describe("vuegc errors", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("fails with exit code 1 when --name is missing (#20)", () => {
        const { status, stdout } = runVuegc(project, ["--style", "css"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/Flag name required/);
        expect(stdout).toMatch(/Generating vue component failure/);
    });

    it("rejects an unsupported style and writes nothing (#14)", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Hello", "--style", "less"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/Style less not supported, use one of: css, scss, stylus/);
        expect(readComponent(project, "Hello.vue")).toBeNull();
    });

    it("never overwrites an existing component (#19)", () => {
        const file = path.join(project, "src", "Hello.vue");
        fs.writeFileSync(file, "my own work");

        const { status, stdout } = runVuegc(project, ["--name", "Hello"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/Component already exists/);
        expect(fs.readFileSync(file, "utf-8")).toBe("my own work");
    });
});

describe("vuegc outside a Vue project", () => {
    let folder;

    beforeEach(() => { folder = createEmptyFolder(); });
    afterEach(() => { removeFolder(folder); });

    it("explains it's not the root of a Vue project (#18)", () => {
        const { status, stdout } = runVuegc(folder, ["--name", "Hello"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/It is not the root of Vue project/);
    });
});
