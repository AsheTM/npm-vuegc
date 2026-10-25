const
    { describe, it, beforeEach, afterEach } = require("node:test"),
    assert                                  = require("node:assert/strict"),
    fs                                      = require("node:fs"),
    path                                    = require("node:path"),
    { createVueProject, removeFolder, runVuegc } = require("./support/vue-project");

describe("vuegc help", () => {
    let project;

    // A fresh Vue project for each test, deleted afterwards
    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    // The same checks for every way of asking for help
    for (const args of [[], ["--help"], ["-h"], ["-h", "x"], ["--help", "--name"]]) {
        it(`shows the help for: vuegc ${ args.join(" ") || "(no argument)" }`, () => {
            const { status, stdout } = runVuegc(project, args);

            assert.equal(status, 0);
            assert.match(stdout, /vuegc --name HelloWorld\.vue/);
            assert.match(stdout, /Required flag\(s\):/);
        });
    }

    it("doesn't generate anything", () => {
        runVuegc(project, ["--help"]);

        const files = fs.readdirSync(path.join(project, "src"));
        assert.deepEqual(files.sort(), ["App.vue", "main.js"]);
    });
});
