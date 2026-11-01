#! /usr/bin/env node
// Requirement
const 
    fs          = require("fs"), 
    path        = require("path"), 
    Handlebars  = require("handlebars");

const 
    vueHelp     = require("./services/vuegc-help");


//////////////////Error Handler/////////////////
////////////////////////////////////////////////
/**
 *  @description    Get value of a flag
 */
function getValueof(args, flag, obj = Object) {
    let thatValue   = null,  
        match       = false;
    args.forEach(value => {
        if(match)
            thatValue = value.startsWith("--") || value.startsWith("-") || value;
        match = (value == flag);
    });
    // Flag passed as last argument
    if(match)
        thatValue = true;
    return thatValue;
}
////////////////////////////////////////////////
////////////////////////////////////////////////

//////////////////Error Handler/////////////////
////////////////////////////////////////////////
/**
 *  @description    Error handling
 */
function errorHandler(err) {
    let exit = err.exit;
    // System errors have a portable code, ours only an errno
    switch(err.code || err.errno) {
        case "EEXIST":
            console.log(err.file
                ? `\t[!] ${ err.file } already exists, use --force to overwrite it [!]`
                : "\t[!] Component already exists, use --force to overwrite it [!]");
            exit = true;
            break;
        case "ENOENT":
            console.log("\t[!] It is not the root of Vue project [!]");
            exit = true;
            break;
        case 0x0001:
            console.log(`\t[!] src/${ err.entry || "main.js" } doesn't create a Vue 3 app (createApp) [!]`);
            exit = true;
            break;
        case 0x000B:
            console.log(err.event
                ? `	[!] Event "${ err.event }" must be a valid event name, e.g. --emits update,update:modelValue [!]`
                : "	[!] --emits needs a list of event names, e.g. --emits update,close [!]");
            exit = true;
            break;
        case 0x000C:
            console.log("	[!] --emits needs the script section: remove --no-script [!]");
            exit = true;
            break;
        case 0x000A:
            console.log("\t[!] This is a Vue 2 project: vuegc 2 generates Vue 3 components, use vuegc 1 (npm install -g vuegc@1) [!]");
            exit = true;
            break;
        case 0x000D:
            console.log(`\t[!] Template ${ err.template } not supported, use one of: ${ supported.template.join(", ") } [!]`);
            exit = true;
            break;
        case 0x000E:
            console.log("\t[!] --template needs the template section: remove --no-template [!]");
            exit = true;
            break;
        case 0x0002:
            console.log("\t[!] App.vue of Vue Project not found [!]");
            exit = true;
            break;
        case 0x0003: 
            console.log(`\t[!] Flag ${ err.flag } required [!]`);
            exit = true;
            break;
        case 0x0004:
            console.log(`\t[!] Style ${ err.style } not supported, use one of: ${ supported.style.join(", ") } [!]`);
            exit = true;
            break;
        case 0x0005:
            console.log(`\t[!] Path "${ err.path }" must be a folder inside src/, e.g. --path components [!]`);
            exit = true;
            break;
        case 0x0006:
            console.log("\t[!] A component needs at least one section: don't use --no-template, --no-script and --no-style together [!]");
            exit = true;
            break;
        case 0x0007:
            console.log(err.prop
                ? `\t[!] Prop "${ err.prop }" must be a valid JavaScript name, e.g. --props title,userName [!]`
                : "\t[!] --props needs a list of names, e.g. --props title,userName [!]");
            exit = true;
            break;
        case 0x0008:
            console.log("\t[!] --props needs the script section: remove --no-script [!]");
            exit = true;
            break;
        case 0x0009:
            console.log("\t[!] --module needs the style section: remove --no-style [!]");
            exit = true;
            break;
        default: 
            console.error(err);
            exit = true;
            break;
    }
    // If error spotted
    if(exit) {
        console.log("> Generating vue component failure");
        process.exit(1);
    }
}
////////////////////////////////////////////////
////////////////////////////////////////////////


/////////////Checking Required Args/////////////
////////////////////////////////////////////////
/**
 *  @description    Check all required args necessarly to do the work
 */
function _checkRequiredArgs(requiredArgs) {
    for(let arg in requiredArgs) 
        if(requiredArgs[arg] == null)
                return { errno: 0x0003, msg: "Flag " + arg + " required", flag: arg, exit: true };
    return null;
}
////////////////////////////////////////////////
////////////////////////////////////////////////


///////////////////HandleBars///////////////////
////////////////////////////////////////////////
/**
 *  @description    Prepare HandleBars for appending Template, Style and Script html content
 */
function registerHelpers({ name, style, template, blank, props, emits, cssModule, optionsApi, ts }) {
    const componentFileName = toCapitalize(name.replace(/\.vue$/, ""));
    _registerHelperTemplate(componentFileName, template, blank, cssModule);
    _registerHelperScript(componentFileName, props, emits, optionsApi, ts);
    _registerHelperStyle(componentFileName, style, blank, cssModule);
}
function _registerHelperTemplate(componentFileName, template, blank, cssModule) {
    Handlebars.registerHelper("defaultTemplate", function(text, url) {
        // Pug: same content, #id and #[tag] for the inline tags
        if(template == "pug") {
            const root = cssModule ? `div(:class="$style.root")` : `#${ componentFileName }`;
            return new Handlebars.SafeString(blank
                ? "div"
                : `${ root } Component #[span ${ componentFileName }] generated by #[a(href="") VueGC]`);
        }
        // CSS modules rename the selectors: the template goes through $style
        const root = cssModule ? `:class="$style.root"` : `id="${ componentFileName }"`;
        let result = blank
            ? `<div></div>`
            : `<div ${ root }> Component <span>${ componentFileName }</span> generated by <a href="">VueGC</a> </div>`;
        return new Handlebars.SafeString(result);
    });
}
function _registerHelperScript(componentFileName, props, emits, optionsApi, ts) {
    Handlebars.registerHelper("defaultScript", function(text, url) {
        // null (unknown in TypeScript): any type, the user sets the real types
        const emitsList = `[${ emits.map(event => `"${ event }"`).join(", ") }]`;
        // <script setup> (default): only what's declared; the component name comes from the file name
        if(!optionsApi) {
            const lines = [];
            // TypeScript: type-based declarations; event names like update:modelValue are quoted keys
            const key = (name) => /^[A-Za-z_$][\w$]*$/.test(name) ? name : `"${ name }"`;
            if(props.length)
                lines.push(ts
                    ? `const props = defineProps<{\n${ props.map(prop => `    ${ prop }?: unknown;`).join("\n") }\n}>();`
                    : `const props = defineProps({\n${ props.map(prop => `    ${ prop }: null`).join(",\n") }\n});`);
            if(emits.length)
                lines.push(ts
                    ? `const emit = defineEmits<{\n${ emits.map(event => `    ${ key(event) }: [...args: unknown[]];`).join("\n") }\n}>();`
                    : `const emit = defineEmits(${ emitsList });`);
            return new Handlebars.SafeString(lines.join("\n"));
        }
        // Options API (--options): same as vuegc 1.x, plus the emits; defineComponent() for TypeScript
        const propsBlock = props.length
            ? `{\n${ props.map(prop => `        ${ prop }: null`).join(",\n") }\n    }`
            : "{ }";
        const body = `{
    name: "${ componentFileName }",
    props: ${ propsBlock },${ emits.length ? `\n    emits: ${ emitsList },` : "" }
    data() {
        return { };
    },
    methods: { }
}`;
        let result = ts
            ? `import { defineComponent } from "vue";\n\nexport default defineComponent(${ body });`
            : `export default ${ body }`;
        return new Handlebars.SafeString(result);
    });
}
function _registerHelperStyle(componentFileName, style, blank, cssModule) {
    Handlebars.registerHelper("defaultStyle", function(text, url) {
        if(blank)
            return "";
        const root = cssModule ? ".root" : `#${ componentFileName }`;
        // Sass indented syntax: no braces, no semicolons, nesting by indentation
        if(style == "sass")
            return new Handlebars.SafeString(`${ root }
    font-size: 16px
    line-height: 150%

    span
        font-weight: bold
    a
        font-style: italic`);
        const spanStyle = "span { font-weight: bold; }";
        const aStyle = "a { font-style: italic; }";
        // Pre-processors support nesting, plain CSS gets the rules after the block
        // (prefixed by .root with CSS modules, to stay local to the component)
        const nested = style != "css";
        const prefix = cssModule ? ".root " : "";
        let result = `${ root } {
    font-size: 16px;
    line-height: 150%;${ nested ? "\n\n    " + spanStyle + "\n    " + aStyle : "" }
}${ nested ? "" : "\n" + prefix + spanStyle + "\n" + prefix + aStyle }`;
        return new Handlebars.SafeString(result);
    }); 
}
////////////////////////////////////////////////
////////////////////////////////////////////////


/////////////////////Utils//////////////////////
////////////////////////////////////////////////
function toCapitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
// "title, items,title" -> ["title", "items"]; anything but a non-empty string is invalid
function _parseList(value) {
    if(typeof value !== "string")
        return [""];
    return [...new Set(value.split(",").map(item => item.trim()).filter(item => item))];
}
// A boolean flag is on when present, unless its value is "false"
function _isOn(value) {
    return value !== null && value !== "false";
}
// A JavaScript name for importing the component: hello-world -> HelloWorld
function _identifier(text) {
    const identifier = text.split(/[^A-Za-z0-9_$]+/).filter(part => part).map(toCapitalize).join("");
    return /^[0-9]/.test(identifier) ? "_" + identifier : identifier;
}
// Vitest test of the component, mounted with Vue Test Utils (with its props)
function _testContent({ importName, file, title, props }, hasText) {
    const options = props.length ? `, { props: { ${ props.map(prop => `${ prop }: "${ prop }"`).join(", ") } } }` : "";
    return `import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ${ importName } from "./${ file }";

describe("${ title }", () => {
    it("renders", () => {
        const wrapper = mount(${ importName }${ options });

        expect(wrapper.exists()).toBe(true);${ hasText ? `\n        expect(wrapper.text()).toContain("${ title }");` : "" }
    });
});
`;
}
// Print how to install the packages a generated file needs, when the project's package.json lacks one of them
function _hintMissing(cwd, packages, message) {
    let pkg;
    try {
        pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), { encoding: 'utf-8' }));
    } catch {
        // No readable package.json: nothing to compare with
        return;
    }
    const installed = { ...pkg.dependencies, ...pkg.devDependencies };
    const missing = packages.filter(name => !(name in installed));
    if(missing.length)
        console.log(`\t[!] ${ message }: npm install -D ${ missing.join(" ") } [!]`);
}
// A relative folder that stays inside the base folder (no "..", not absolute)
function _isInside(base, folder) {
    if(typeof folder !== "string" || path.isAbsolute(folder))
        return false;
    const relative = path.relative(base, path.join(base, folder));
    return relative !== ".." && !relative.startsWith(".." + path.sep);
}
////////////////////////////////////////////////
////////////////////////////////////////////////


/////////////Checking the Vue project/////////////
////////////////////////////////////////////////
/**
 *  @description    Check src/ belongs to a Vue 3 project: an entry creating the app (createApp),
 *                  and App.vue. A Vue 2 project (new Vue) is refused: it's the job of vuegc 1.
 */
function _checkVueProject(pathSrc) {
    const entry = project.entries.find(file => fs.existsSync(path.join(pathSrc, file)));
    // No entry: not the root of a Vue project
    if(!entry)
        throw { code: "ENOENT", exit: true };
    const main = fs.readFileSync(path.join(pathSrc, entry), { encoding: 'utf-8' });
    const app = fs.readFileSync(path.join(pathSrc, project.app), { encoding: 'utf-8' });

    if(/\bnew Vue\s*\(/.test(main))
        throw { errno: 0x000A, exit: true };
    if(!/\bcreate(SSR)?App\s*\(/.test(main))
        throw { errno: 0x0001, entry: entry, exit: true };
    if(!/(template)|(script)|(style)/i.test(app))
        throw { errno: 0x0002, exit: true };
}
////////////////////////////////////////////////
////////////////////////////////////////////////


////////////////////////////////////////
/////////////////Start//////////////////
////////////////////////////////////////
// Main Constants
const
    // Files of a Vue 3 project, inside src/: the entry (Vite + TypeScript uses main.ts) and the root component
    project             = {
        entries:    ["main.js", "main.ts"],
        app:        "App.vue"
    },
    supported           = {
        style:      ["css", "scss", "sass", "less", "stylus"],
        template:   ["html", "pug"]
    };

// Run the CLI only when launched as a command, not when required
if(require.main === module) {
    const
        allArgs             = process.argv,
        args                = allArgs.slice(2),
        requiredArgs        = {
            name:   getValueof(args, "--name", String),
        },
        help                = getValueof(args, "--help", Boolean) || getValueof(args, "-h", Boolean) || args.length == 0,
        optionalArgs        = {
            path:       getValueof(args, "--path", String),
            blank:      _isOn(getValueof(args, "--blank", Boolean)),
            force:      _isOn(getValueof(args, "--force", Boolean)),
            dryRun:     _isOn(getValueof(args, "--dry-run", Boolean)),
            noTemplate: _isOn(getValueof(args, "--no-template", Boolean)),
            noScript:   _isOn(getValueof(args, "--no-script", Boolean)),
            noStyle:    _isOn(getValueof(args, "--no-style", Boolean)),
            props:      getValueof(args, "--props", String),
            cssModule:  _isOn(getValueof(args, "--module", Boolean)),
            optionsApi: _isOn(getValueof(args, "--options", Boolean)),
            emits:      getValueof(args, "--emits", String),
            ts:         _isOn(getValueof(args, "--ts", Boolean)),
            test:       _isOn(getValueof(args, "--test", Boolean)),
            template:  getValueof(args, "--template", String) || "html",
            style:      {
                scoped: getValueof(args, "--scoped", Boolean) !== "false",
                style:  getValueof(args, "--style", String)   || "css",
            }
        };

    try {
        if(help) {
            vueHelp();
        } else {
            // Checking for existing of all required arguments
            const check = _checkRequiredArgs(requiredArgs);
            if(check)
                throw check;
            vuegc({
                name:   requiredArgs.name,
                style:  optionalArgs.style.style,
                scoped: optionalArgs.style.scoped,
                template:   optionalArgs.template,
                path:   optionalArgs.path === null ? undefined : optionalArgs.path,
                blank:  optionalArgs.blank,
                force:  optionalArgs.force,
                dryRun: optionalArgs.dryRun,
                noTemplate: optionalArgs.noTemplate,
                noScript:   optionalArgs.noScript,
                noStyle:    optionalArgs.noStyle,
                props:      optionalArgs.props === null ? undefined : _parseList(optionalArgs.props),
                cssModule:  optionalArgs.cssModule,
                optionsApi: optionalArgs.optionsApi,
                emits:      optionalArgs.emits === null ? undefined : _parseList(optionalArgs.emits),
                ts:         optionalArgs.ts,
                test:       optionalArgs.test
            });
        }
    } catch(err) {
        errorHandler(err);
    }
}

/**
 *  @description    Generate a Vue component in <cwd>/src/<path>/ (dryRun: print it, write nothing)
 *  @returns        Path of the generated component
 */
function vuegc({ name, style = "css", scoped = true, template = "html", path: folder = "", blank = false, force = false, dryRun = false, noTemplate = false, noScript = false, noStyle = false, props = [], cssModule = false, optionsApi = false, emits = [], ts = false, test = false, cwd = process.cwd() } = {}) {
    // Checking the required name
    if(typeof name !== "string" || !name)
        throw { errno: 0x0003, flag: "name", exit: true };

    // Checking if the style is supported
    if(!supported.style.includes(style))
        throw { errno: 0x0004, style: style, exit: true };

    // Checking if the template language is supported, and has a template section to be written in
    if(!supported.template.includes(template))
        throw { errno: 0x000D, template: template, exit: true };
    if(template != "html" && noTemplate)
        throw { errno: 0x000E, exit: true };

    // Checking at least one section remains
    if(noTemplate && noScript && noStyle)
        throw { errno: 0x0006, exit: true };

    // Checking the props: JavaScript names, and a script section to declare them
    const invalidProp = Array.isArray(props) ? props.find(prop => !/^[A-Za-z_$][\w$]*$/.test(prop)) : "";
    if(invalidProp !== undefined)
        throw { errno: 0x0007, prop: String(invalidProp), exit: true };
    if(props.length && noScript)
        throw { errno: 0x0008, exit: true };

    // Checking the events: names like update or update:modelValue, and a script section to declare them
    const invalidEvent = Array.isArray(emits) ? emits.find(event => !/^[A-Za-z][\w:-]*$/.test(event)) : "";
    if(invalidEvent !== undefined)
        throw { errno: 0x000B, event: String(invalidEvent), exit: true };
    if(emits.length && noScript)
        throw { errno: 0x000C, exit: true };

    // Checking CSS modules have a style section to define $style
    if(cssModule && noStyle)
        throw { errno: 0x0009, exit: true };

    // Checking the output folder stays inside src/
    const pathSrc = path.join(cwd, "./src/");
    if(!_isInside(pathSrc, folder))
        throw { errno: 0x0005, path: typeof folder === "string" ? folder : "", exit: true };

    // Initializing
    const
        componentName       = name.endsWith(".vue") ? name : (name + ".vue"),
        pathComponent       = path.join(pathSrc, folder, componentName),
        sourceTemplate      = fs.readFileSync(path.join(__dirname, "./template/Template.vue.sample"), { encoding: 'utf-8' }),
        compileTemplate     = Handlebars.compile(sourceTemplate),
        dataTemplate        = {
            style:  style,
            // <template> attribute: HTML has no lang
            template:   template == "html" ? '' : ` lang="${ template }"`,
            // <style> attribute: CSS modules replace scoped
            scoped: cssModule ? ' module' : (scoped ? ' scoped' : ''),
            // <script> attributes: <script setup> unless the Options API is asked, lang="ts" for TypeScript
            script: (optionsApi ? '' : ' setup') + (ts ? ' lang="ts"' : ''),
            sections: { template: !noTemplate, script: !noScript, style: !noStyle }
        };

    // Preparing template/script/style
    registerHelpers({ name, style, template, blank, props, emits, cssModule, optionsApi, ts });

    // Start to generating vue component
    console.log("> Generating vue component starting");

    // Checking I'm at the root of a Vue 3 project
    _checkVueProject(pathSrc);

    // LF line endings whatever the OS the template was installed on
    // (a left-out first section leaves an empty first line)
    let component = compileTemplate(dataTemplate).replace(/\r\n/g, "\n").replace(/^\n+/, "");
    // An empty <script setup> or style section shouldn't keep an empty line
    component = component.replace(/\n[ \t]*\n<\/(script|style)>/g, "\n</$1>");
    // Files generated next to the component, named after it (--test: Card.spec.js, Card.spec.ts with --ts)
    const
        baseName        = componentName.replace(/\.vue$/, ""),
        componentInfo   = { importName: _identifier(baseName), file: componentName, title: toCapitalize(baseName), props },
        extension       = ts ? "ts" : "js",
        companions      = [];
    if(test)
        companions.push({
            label:      "Test",
            file:       path.join(path.dirname(pathComponent), `${ baseName }.spec.${ extension }`),
            // The demo text is only there with a template, and without --blank
            content:    _testContent(componentInfo, !noTemplate && !blank)
        });
    const relative = (file) => path.relative(cwd, file).split(path.sep).join("/");

    // Nothing is written if one of the files exists, unless forced
    const existing = [pathComponent, ...companions.map(companion => companion.file)].filter(file => fs.existsSync(file));
    if(existing.length && !force)
        throw existing[0] == pathComponent ? { code: "EEXIST", exit: true } : { code: "EEXIST", file: relative(existing[0]), exit: true };

    // What the project needs to install for the generated code, once it's generated
    const hints = () => {
        if(template == "pug")
            _hintMissing(cwd, ["pug"], "Pug templates need the pug package");
        if(test)
            _hintMissing(cwd, ["vitest", "@vue/test-utils"], "Tests run with Vitest and Vue Test Utils");
    };

    // Dry run: same checks as a real run, but print instead of writing
    if(dryRun) {
        console.log(`> Dry run, nothing written: ${ relative(pathComponent) }\n`);
        console.log(component);
        for(const companion of companions) {
            console.log(`> Dry run, nothing written: ${ relative(companion.file) }\n`);
            console.log(companion.content);
        }
        hints();
        console.log("> Generating vue component success");
        return pathComponent;
    }

    // Creating the output folder if missing
    fs.mkdirSync(path.dirname(pathComponent), { recursive: true });

    // Creating the component, without overwriting an existing one unless forced
    fs.writeFileSync(pathComponent, component, { flag: force ? "w" : "wx" });
    if(existing.includes(pathComponent))
        console.log("\t[!] Existing component overwritten [!]");
    for(const companion of companions) {
        fs.writeFileSync(companion.file, companion.content, { flag: force ? "w" : "wx" });
        console.log(`> ${ companion.label } written: ${ relative(companion.file) }`);
        if(existing.includes(companion.file))
            console.log(`\t[!] Existing ${ relative(companion.file) } overwritten [!]`);
    }
    hints();

    // Generation vue component done
    console.log("> Generating vue component success");
    return pathComponent;
}

module.exports = { vuegc, errorHandler };
