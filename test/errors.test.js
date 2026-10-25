const
    { describe, it, beforeEach, afterEach } = require("node:test"),
    assert                                  = require("node:assert/strict"),
    fs                                      = require("node:fs"),
    path                                    = require("node:path"),
    { createVueProject, createEmptyFolder, removeFolder, runVuegc, readComponent } = require("./support/vue-project");

describe("vuegc errors", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("fails with exit code 1 when --name is missing (#20)", () => {
        const { status, stdout } = runVuegc(project, ["--style", "css"]);

        assert.equal(status, 1);
        assert.match(stdout, /Flag name required/);
        assert.match(stdout, /Generating vue component failure/);
    });

    it("rejects an unsupported style and writes nothing (#14)", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Hello", "--style", "less"]);

        assert.equal(status, 1);
        assert.match(stdout, /Style less not supported, use one of: css, scss, stylus/);
        assert.equal(readComponent(project, "Hello.vue"), null);
    });

    it("never overwrites an existing component (#19)", () => {
        const file = path.join(project, "src", "Hello.vue");
        fs.writeFileSync(file, "my own work");

        const { status, stdout } = runVuegc(project, ["--name", "Hello"]);

        assert.equal(status, 1);
        assert.match(stdout, /Component already exists/);
        assert.equal(fs.readFileSync(file, "utf-8"), "my own work");
    });
});

describe("vuegc outside a Vue project", () => {
    let folder;

    beforeEach(() => { folder = createEmptyFolder(); });
    afterEach(() => { removeFolder(folder); });

    it("explains it's not the root of a Vue project (#18)", () => {
        const { status, stdout } = runVuegc(folder, ["--name", "Hello"]);

        assert.equal(status, 1);
        assert.match(stdout, /It is not the root of Vue project/);
    });
});
