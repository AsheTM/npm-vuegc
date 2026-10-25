import { describe, it, expect, afterEach } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { createVueProject, createVue2Project, createEmptyFolder, removeFolder, runVuegc, readComponent } = require("./support/vue-project.js");

describe("Vue 3 projects", () => {
    let project;

    afterEach(() => { removeFolder(project); });

    it.each([
        { label: "main.js with createApp (Vite, Vue CLI 5)", entry: "main.js", main: "import { createApp } from 'vue'\ncreateApp(App).mount('#app')\n" },
        { label: "main.ts (Vite + TypeScript)",              entry: "main.ts", main: "import { createApp } from 'vue'\ncreateApp(App).mount('#app')\n" },
        { label: "createSSRApp",                             entry: "main.js", main: "import { createSSRApp } from 'vue'\nexport function createApp() { return { app: createSSRApp(App) } }\n" },
        { label: "app in a variable",                        entry: "main.js", main: "import { createApp } from 'vue'\nconst app = createApp(App)\napp.use(router)\napp.mount('#app')\n" },
    ])("generates in a project with $label", ({ entry, main }) => {
        project = createVueProject({ entry, main });

        const { status } = runVuegc(project, ["--name", "Hello"]);

        expect(status).toBe(0);
        expect(readComponent(project, "Hello.vue")).not.toBeNull();
    });
});

describe("other projects", () => {
    let project;

    afterEach(() => { removeFolder(project); });

    it("refuses a Vue 2 project and points to vuegc 1", () => {
        project = createVue2Project();

        const { status, stdout } = runVuegc(project, ["--name", "Hello"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/This is a Vue 2 project: vuegc 2 generates Vue 3 components, use vuegc 1 \(npm install -g vuegc@1\)/);
        expect(readComponent(project, "Hello.vue")).toBeNull();
    });

    it("refuses a Vue 2 project in a dry run too", () => {
        project = createVue2Project();

        expect(runVuegc(project, ["--name", "Hello", "--dry-run"]).status).toBe(1);
    });

    it.each([
        { entry: "main.js", message: /src\/main\.js doesn't create a Vue 3 app \(createApp\)/ },
        { entry: "main.ts", message: /src\/main\.ts doesn't create a Vue 3 app \(createApp\)/ },
    ])("explains when $entry doesn't create a Vue app", ({ entry, message }) => {
        project = createVueProject({ entry, main: "console.log('hello')\n" });

        const { status, stdout } = runVuegc(project, ["--name", "Hello"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(message);
    });

    it("is not the root of a Vue project without src/main.js nor src/main.ts", () => {
        project = createEmptyFolder();
        fs.mkdirSync(path.join(project, "src"));

        const { status, stdout } = runVuegc(project, ["--name", "Hello"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/It is not the root of Vue project/);
    });

    it("is not the root of a Vue project without src/App.vue", () => {
        project = createVueProject();
        fs.unlinkSync(path.join(project, "src", "App.vue"));

        const { status, stdout } = runVuegc(project, ["--name", "Hello"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/It is not the root of Vue project/);
    });
});
