#! /usr/bin/env node
// Requirement
const 
    fs          = require("fs"), 
    path        = require("path"), 
    Handlebars  = require("handlebars");

const 
    vueHelp     = require("./services/vue-help");


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
        match = (value == obj(flag));
    });
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
    switch(err.errno) {
        case -4075:
            console.log("\t[!] Folder already exists [!]");
            break;
        case -4058: 
            console.log("\t[!] It is not the root of Vue project [!]");
            exit = true;
            break;
        case 0x0001: 
            console.log("\t[!] main.js of Vue Project not found [!]");
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
        default: 
            console.error(err);
            exit = true;
            break;
    }
    // If error spotted
    if(exit) {
        console.log("> Generating vue component failure");
        process.exit();
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
function registerHelpers() {
    const componentFileName = requiredArgs.name.toCapitalize();
    _registerHelperTemplate(componentFileName);
    _registerHelperScript(componentFileName);
    _registerHelperStyle(componentFileName);
}
function _registerHelperTemplate(componentFileName) {
    Handlebars.registerHelper("defaultTemplate", function(text, url) {
        let result = `<div id="${ componentFileName }"> Component <span>${ componentFileName }</span> generated by <a href="">VueGC</a> </div>`;
        return new Handlebars.SafeString(result);
    });
}
function _registerHelperScript(componentFileName) {
    Handlebars.registerHelper("defaultScript", function(text, url) {
        let result = `export default {
    name: "${ componentFileName }", 
    props: { }, 
    data() { }, 
    methods() { }
}`;
        return new Handlebars.SafeString(result);
    });
}
function _registerHelperStyle(componentFileName) {
    Handlebars.registerHelper("defaultStyle", function(text, url) {
        const spanStyle = "span{ font-weight: bold; }";
        const aStyle = "a{ font-style: italic; }";
        let result = `#${ componentFileName }{
    \tfont-size: 16px;
    \tline-height: 150%;${ supported.style.includes(optionalArgs.style.style) && optionalArgs.style.style != "css" 
            ? "\n\t\t" + spanStyle + "\n\t\t" + aStyle 
            : "" }
    }${ optionalArgs.style.style == "css" ? "\n" + spanStyle + "\n" + aStyle : "" }`;
        return new Handlebars.SafeString(result);
    }); 
}
////////////////////////////////////////////////
////////////////////////////////////////////////


///////////////////Prototypes///////////////////
////////////////////////////////////////////////
String.prototype.toCapitalize = function() {
    return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
}
////////////////////////////////////////////////
////////////////////////////////////////////////


////////////////////////////////////////
/////////////////Start//////////////////
////////////////////////////////////////
// Main Constants
const 
    pathLaunchedCmd     = process.cwd(), 
    fileName            = {
        "main.js": "main.js", 
        "App.vue": "App.vue"
    }, 
    rootVueProject      = {
        "main.js":  path.join(pathLaunchedCmd, './src/', fileName['main.js']), 
        "App.vue":  path.join(pathLaunchedCmd, './src/', fileName['App.vue'])
    }, 
    allArgs             = process.argv, 
    nodeFile            = allArgs[0], 
    vuegcFile           = allArgs[1], 
    serviceArg          = "component" || allArgs[2], 
    args                = allArgs.slice(-1 * (allArgs.length - 2)), 
    requiredArgs        = {
        name:   getValueOf(args, "--name", String), 
    }, 
    serviceArgs         = {
        help:       getValueOf(args, "--help", Boolean) || getValueof(args, "-h", Boolean) || args.length == 0, 
        component:  true, 
        view:       false, 
    }, 
    optionalArgs        = {
        template:   {
            // 
        }, 
        script:     {
            // 
        }, 
        style:      {
            scoped: getValueOf(args, "--scoped", Boolean) || true, 
            style:  getValueOf(args, "--style", String)   || "scss", 
        }
    }, 
    supported           = {
        style:  ["css", "scss", "stylus"]
    };

try {
    // Checking for existing of all required arguments
    const check = _checkRequiredArgs(requiredArgs);
    switch(true) {
        case serviceArgs.help: 
            vueHelp(serviceArg);
        case serviceArgs.component: 
            if(check)
                throw check;
            vuegc();
        case serviceArgs.view: 
            // Incoming
    }
} catch(err) {
    errorHandler(err);
}

function vuegc() {
    // Initializing
    const 
        componentName       = requiredArgs.name.endsWith(".vue") ? requiredArgs.name : (requiredArgs.name + ".vue"), 
        pathComponent       = path.join(pathLaunchedCmd, "./src/", componentName), 
        sourceTemplate      = fs.readFileSync(path.join(__dirname, "./Template.vue.sample"), { encoding: 'utf-8' }), 
        compileTemplate     = Handlebars.compile(sourceTemplate), 
        dataTemplate        = {
            style:  optionalArgs.style.style, 
            scoped: optionalArgs.style.scoped ? ' scoped' : ''
        };
    
    // Preparing template/script/style
    registerHelpers();
    
    // Start to generating vue component
    console.log("> Generating vue component starting");

    // Checking if I'm in the root of Vue project
    let content = {
        "main.js": fs.readFileSync(rootVueProject["main.js"], { encoding: 'utf-8' }), 
        "App.vue": fs.readFileSync(rootVueProject["App.vue"], { encoding: 'utf-8' })
    };
    if(!content[fileName["main.js"]].match(/(new Vue)|(from 'vue')|Vue\./gi)) 
        throw { errno: 0x0001, exit: true };
    if(!content[fileName["App.vue"]].match(/(template)|(script)|(style)/gi)) 
        throw { errno: 0x0002, exit: true };

    // Creating the folders for the component
    fs.mkdirSync(path.join(pathLaunchedCmd, "./src/"));
    console.log("\t [!] New folder(s) created [!]");

    // Creating the component
    fs.writeFileSync(pathComponent, compileTemplate(dataTemplate));

    // Generation vue component done
    console.log("> Generating vue component success");
}
