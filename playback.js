const r = require('robotjs');
const fs = require('fs');
const buttons = ["", "left", "right"];
var playbackCount = 1;
// todo user configurable 
var maxPlayback = 20;
var timeBetweenPlayback = 500; //ms

async function handleClick(command) {
    r.moveMouse(command['x'], command['y']);
    r.mouseClick(buttons[command['button']]); 
}

var commands = {
    // https://stackoverflow.com/a/39914235/1524950
    "wait": async (command) => { return new Promise(resolve => setTimeout(resolve, command.ms)); },
    "mouseclick": handleClick,
    "mouseup": handleClick,
    "movemouse": async (command) => { r.moveMouse(command['x'], command['y']); },
    "keyup": async (command) => {
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
// This will go until it hits a wait. The wait will run the next runCommands() in a setTimeout, which will run all commands until the next wait.
// It's kind of like strtok
function runCommands(index) {
    var value = input[index];
    if (value != undefined && value['type'] != undefined) {
        console.log(value);
        commands[value["type"]](value).then(() => runCommands(index + 1));
    }
    else {
        playbackCount++;
        if (playbackCount <= maxPlayback) {
            console.log("Waiting " + timeBetweenPlayback + "ms (will be iteration " + playbackCount + "/" + maxPlayback + ").");
            setTimeout(() => { runCommands(0) }, timeBetweenPlayback);
        }
    }
} 
runCommands(0);