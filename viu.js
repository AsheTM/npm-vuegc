#! /usr/bin/env node

const
    viuHelp             = require("./services/viu-help"), 
    viuComponentHelp    = require("./services/viu-component-help");

////////////////////////////////////////////////
/**
 *  @description    Get value of a flag
 */
function getValueof(args, flag, obj = Object) {
    let thatValue   = null,  
        match       = false;
    args.forEach(arg => {
        if(match)
            thatValue = arg.startsWith("--") || arg.startsWith("-") || arg;
        match = (arg == obj(flag));
    });
    return thatValue;
}
////////////////////////////////////////////////
////////////////////////////////////////////////
const DEACTIVATE = false;
////////////////////////////////////////////////


const 
    pathLaunchedCmd     = process.cwd(), 
    allArgs             = process.argv, 
    nodeFile            = allArgs[0], 
    vuegcFile           = allArgs[1], 
    serviceArg          = allArgs[2], 
    args                = allArgs.slice(-1 * (allArgs.length - 3)), 
    requiredArgs        = {
        name:   getValueOf(args, "--name", String), 
    }, 
    serviceArgs         = {
        help:       serviceArg == 'help' || !serviceArg
                || getValueOf(args, "--help", Boolean) 
                || getValueof(args, "-h", Boolean) 
                || args.length == 0, 
        component:  serviceArg == 'component', 
        view:       DEACTIVATE && serviceArg == 'view', 
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
    };

switch(true) {
    case serviceArgs.component: 
        viuComponentHelp();
    case serviceArgs.help: 
    default: 
        viuHelp();
}
