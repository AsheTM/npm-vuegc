const
    { describe, it, beforeEach, afterEach } = require("node:test"),
    assert                                  = require("node:assert/strict"),
    { createVueProject, removeFolder, runVuegc, readComponent } = require("./support/vue-project");

describe("vuegc --name", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("generates src/<Name>.vue and exits with 0", () => {
        const { status, stdout } = runVuegc(project, ["--name", "Hello"]);

        assert.equal(status, 0);
        assert.match(stdout, /Generating vue component success/);
        assert.notEqual(readComponent(project, "Hello.vue"), null);
    });

    it("uses the name for the component name and the root id", () => {
        runVuegc(project, ["--name", "Hello"]);
        const component = readComponent(project, "Hello.vue");

        assert.match(component, /name: "Hello"/);
        assert.match(component, /<div id="Hello">/);
    });

    it("keeps the case of the name (#15)", () => {
        runVuegc(project, ["--name", "HelloWorld"]);

        assert.match(readComponent(project, "HelloWorld.vue"), /name: "HelloWorld"/);
    });

    it("capitalizes the first letter of the component name", () => {
        runVuegc(project, ["--name", "helloWorld"]);

        assert.match(readComponent(project, "helloWorld.vue"), /name: "HelloWorld"/);
    });

    it("accepts a name ending with .vue without repeating it (#16)", () => {
        runVuegc(project, ["--name", "Hello.vue"]);
        const component = readComponent(project, "Hello.vue");

        assert.match(component, /name: "Hello"/);
        assert.doesNotMatch(component, /Hello\.vue/);
    });

    it("generates a valid Vue 2 script: data() returns an object, methods is an object (#17)", () => {
        runVuegc(project, ["--name", "Hello"]);
        const component = readComponent(project, "Hello.vue");

        assert.match(component, /data\(\) \{\s*return \{ \};\s*\}/);
        assert.match(component, /methods: \{ \}/);
    });
});

describe("vuegc --style", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("uses scss by default", () => {
        runVuegc(project, ["--name", "Hello"]);

        assert.match(readComponent(project, "Hello.vue"), /<style lang="scss"/);
    });

    for (const style of ["css", "scss", "stylus"]) {
        it(`supports --style ${ style }`, () => {
            const { status } = runVuegc(project, ["--name", "Hello", "--style", style]);

            assert.equal(status, 0);
            assert.match(readComponent(project, "Hello.vue"), new RegExp(`<style lang="${ style }"`));
        });
    }
});

describe("vuegc --scoped", () => {
    let project;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    // [arguments, expected <style> tag]
    const cases = [
        [[],                            '<style lang="scss" scoped>'],
        [["--scoped"],                  '<style lang="scss" scoped>'],  // flag as last argument (#8)
        [["--scoped", "true"],          '<style lang="scss" scoped>'],
        [["--scoped", "false"],         '<style lang="scss">'],         // (#12)
    ];

    for (const [args, expected] of cases) {
        it(`${ args.join(" ") || "(default)" } -> ${ expected }`, () => {
            runVuegc(project, ["--name", "Hello", ...args]);

            assert.ok(readComponent(project, "Hello.vue").includes(expected));
        });
    }
});
