const r = require('robotjs');
const fs = require('fs');
const buttons = ["", "left", "right"];
// todo user configurable 
var maxPlayback = 20;

function handleClick(command) {
    r.moveMouse(command['x'], command['y']);
    r.mouseClick(buttons[command['button']]); 
}

var commands = {
    "mouseclick": handleClick,
    "mouseup": handleClick,
    "movemouse": (command) => {
        r.moveMouse(command['x'], command['y']);
    },
    "keyup": (command) => {
        // todo broken b/c keycodes are not lining up like I expect from record.js
        // r.keyTap(command['keycode']);
    }
};

// todo support arbitrary files
var input = fs.readFileSync('./playbackfile.txt');
input = input.toString().split("\n");
for (var i = 0; i < input.length; i++) {
    try {
        var temp = JSON.parse(input[i]);
        input[i] = temp;
    } catch (e) {
        input.splice(i);
        i--;
    }
}

// The file is in the form
// { command data }
// { wait data }
// ...
var playbackCount = 0;
function runCommand(index, waitTime) {
    setTimeout(() => {
        var value = input[index];
        if (value != undefined && value['type'] != undefined) {
            console.log(value);
            commands[value["type"]](value);
        }
        if (input[index + 2] != "" && input[index + 2] != undefined) {
            console.log("Next command in " + input[index+1]['ms'] + "ms");
            runCommand(index + 2, input[index + 1]["ms"]);
        }
        else {
            playbackCount++;
            if (playbackCount < maxPlayback) {
                setTimeout(() => {runCommand(0, 0)}, waitTime);
            }
        }
    }, waitTime);
} runCommand(0, 0);