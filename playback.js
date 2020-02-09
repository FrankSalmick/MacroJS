const r = require('robotjs');
// https://robotjs.io/docs/syntax
const fs = require('fs');
const buttons = ["", "left", "right"];

// https://stackoverflow.com/a/41957152/1524950
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

var commands = {
    "mouseclick": (command) => { 
        r.moveMouse(command['x'], command['y']);
        r.mouseClick(buttons[command['button']]); 
    },
    "movemouse": (command) => {
        r.moveMouse(command['x'], command['y']);
    },
    "keyup": (command) => {
        // broken b/c keycodes are not lining up like I expect from record.js
        // r.keyTap(command['keycode']);
    },
    // "wait": async (command) => {
    //     console.log("Sleeping " + command['ms']);
    //     yield sleep(command['ms']);
    //     console.log("Done");
    // }, 
    "null": () => { return null; }
};

// This is version 0.1 because I need its functionality tonight. 
var input = fs.readFileSync('./playbackfile.txt');
input = input.toString().split("\n");
for (var i = 0; i < input.length; i++) {
    try {
        input[i] = JSON.parse(input[i]);
    } catch (e) {}
}

// Commands are in form
// { command data }
// { wait data }
// So, we run the command, then call runCommand again with the new wait time from the line below, if it exists
function runCommand(index, totalTime) {
    setTimeout(() => {
        var value = input[index];
        if (value != undefined && value['type'] != undefined) {
            commands[value["type"]](value);
        }
        if (input[index + 2] != "" && input[index + 2] != undefined) {
            runCommand(index + 2, totalTime + input[index + 1]["ms"]);
        }
    }, totalTime);
} runCommand(0, 0);