#! /usr/bin/env node
// Requirement
const 
    fs      = require("fs"), 
    path    = require("path");


// Util Functions
function getValueof(flag) {
    let thatValue   = null,  
        match       = false;
    args.forEach(value => {
        if(match && (!value.startsWith("-") || !value.startsWith("--")))
            thatValue = value;
        match = false;
        if(value == flag)
            match = true;
    });
    return thatValue;
}


// Util Prototypes
String.prototype.toCapitalize = function() {
    return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
}
    

// Main Constants
const 
    rootVueProject      = path.join(__dirname, './src/', 'main.js'), 
    args                = process.argv.filter((value, index) => index >= 2), 
    nodeFile            = process.argv[0], 
    vuegcFile           = process.argv[1], 
    requiredArgs        = {
        name: getValueof("--name")
    }, 
    optionalArgs        = {
        template:   {
            // 
        }, 
        script:     {
            // 
        }, 
        style:      {
            // 
        }
    };


try {
    // Checking for existing of all requried arguments
    const 
        componentFileName   = requiredArgs.name.toCapitalize(), 
        componentContent    = `
            <template>
                <div id="${ componentFileName }"> ${ componentFileName }</div>
            </template>

            <script>
            export default {
                name: "${ componentFileName }", 
                props: { }, 
                data() { }, 
                methods() { }
            }
            <script>

            <style>

            <style>
        `;
    // Start to generating vue component
    console.log("> Starting to generate vue component");
    // Checking if I'm in the root of Vue project
    let content = fs.readFileSync(rootVueProject, { encoding: 'utf-8' });
    if(content.includes(/(new Vue)|(from 'vue')|Vue\./gi))
        throw new Error("It is not the root of Vue project");
    // Creating component
    fs.writeFileSync(path.join(__dirname, './src/component/', requiredArgs.name), componentContent);
} catch(err) {
    console.error(err);
    process.exit();
}
