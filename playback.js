const r = require('robotjs');
const keycode = require('keycode')
const fs = require('fs');
const looksame = require('looks-same');
const screenshot = require('screenshot-desktop');
const sharp = require('sharp');
const buttons = ["", "left", "right"];
var playbackCount = 1;
// todo user configurable 
var maxPlayback = 20;
var timeBetweenPlayback = 200; //ms
var macroName = "lor2";
var input;

async function handleClick(command) {
    var mousePos = r.getMousePos(); 
    r.moveMouse(command['x'], command['y']);
    r.mouseClick(buttons[command['button']]);
    r.moveMouse(mousePos['x'], mousePos['y']);
}

function checkForScreenshot(resolve, command) {
    screenshot({format: 'png'}).then((img) => { 
        var locationData = command.locations[0];
        sharp(img).extract({left: Number(locationData.x), top: Number(locationData.y), width: Number(locationData.width), height: Number(locationData.height)}).toBuffer().then(croppedImg => {
            var storedImage = fs.readFileSync("playbackfiles/" + macroName + "/images/" + command.filename + "-" + locationData.x + "-" + locationData.y + "-" + locationData.width + "-" + locationData.height);
            // debug:
            // fs.writeFileSync("stored.png", storedImage);
            // fs.writeFileSync("crop.png", croppedImg);
            // looksame.createDiff({ reference: storedImage, current: croppedImg, diff: 'testout23.png'}, (error) => {if (error) console.log(error); })
            // todo deal with minor differences between images (right now it's basically strict, except for exact color matching)
            looksame(croppedImg, storedImage, {strict: false}, function(error, {equal}) { 
                if (equal) {
                    console.log("Matched.");
                    resolve();
                } else {
                    checkForScreenshot(resolve, command);
                }
            })
        });
    }).catch(err => { console.log(err); });
}

var commands = {
    "note": async (command) => {
        // do nothing
    },
    "wait": async (command) => { 
        // todo breaks if for less than mid double digits ms
        process.stdout.write("|");
        for (var i = 0; i < 50; i++) {
            setTimeout(() => process.stdout.write("-"), command.ms / 50 * i);
        }
        setTimeout(() => { console.log("|"); }, command.ms);
        return new Promise(resolve => setTimeout(resolve, command.ms)); 
    },
    "mouseclick": handleClick,
    "mouseup": handleClick,
    "regionmatch": async (command) => {
        console.log("|------------     Matching  region     ------------|");
        return new Promise(resolve => checkForScreenshot(resolve, command));
    },
    "movemouse": async (command) => { r.moveMouse(command['x'], command['y']); },
    "keydown": async (command) => { r.keyToggle(keycode(command.rawcode), "down"); },
    "keyup": async (command) => { r.keyToggle(keycode(command.rawcode), "up"); }
};


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
            commands["wait"]({"ms": timeBetweenPlayback}).then(() => runCommands(0));
        }
    }
} 


(() => {
    // there are 50 -s
    console.log("Don't forget to disable flux if using image matching!");
    console.log("|--------------------------------------------------|");
    macroName = process.argv[2];
    if (process.argv[2] == undefined) {
        console.log("No macro name passed as an argument, using 'default'");
        macroName = "default";
    }
    input = fs.readFileSync("playbackfiles/" + macroName + '/playbackfile.txt');
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
    runCommands(0);
})();