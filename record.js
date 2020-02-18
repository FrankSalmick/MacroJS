const io = require('iohook');
const readline = require('readline-sync');
const screenshot = require('screenshot-desktop');
const robot = require('robotjs');
const fs = require('fs');
const configFilename = "./record-config.txt";
const textColor = "\x1b[37m";
var dirtyData = false;
var recording = false;
var lastAction;
var macroName;

// ctrl shift g
// todo hardcoded
var stopKeybind = [29, 42, 34];

// ctrl shift f
var screenshotKeybind = [29, 42, 33];

// todo support more
var options = {
    "mouseup": true,
    "keyup": true
    // wait: true (forced)
};

var mainMenu = {
    "Show config": () => {
        console.log(options);
    },
    "Reload config": () => {
        if (fs.existsSync(configFilename)) {
            var diskConfig = fs.readFileSync(configFilename);
            diskConfig = JSON.parse(diskConfig);
            // Make sure the file has the right data
            var matchesExactly = true;
            Object.keys(options).forEach(value => {
                if (diskConfig[value] == undefined) {
                    console.log("Warning: " + value + " (" + options[value] + ") exists in memory but does not exist in the file.");
                    matchesExactly = false;
                }
            });
            Object.keys(diskConfig).forEach(value => {
                if (options[value] == undefined) {
                    console.log("Warning: " + value + " (" + diskConfig[value] + ") exists on disk but does not exist in memory.");
                    matchesExactly = false;
                }
            });
            // Note, this is a function definition, this code isn't called here. It's called slightly lower in the if/else 
            var mergeConfigs = function () {
                // We could just do options = JSON.parse(diskConfig), 
                // but instead we iterate over diskConfig so that we don't *lose* items in our config (which will probably cause problems down the road)
                Object.keys(diskConfig).forEach(value => {
                    options[value] = diskConfig[value];
                });
            }
            if (matchesExactly) {
                mergeConfigs();
            } else {
                printLogo();
                printColorLine("There were warnings.");
                do {
                    console.log("Config on disk:");
                    console.log(diskConfig);
                    console.log("Config in memory:");
                    console.log(options);
                    // These are two value arrays, the first item is the function to call and the second item is if the loop should repeat again 
                    var mergeChoices = {
                        "Merge configs, favoring values present on disk": [mergeConfigs, false],
                        "Cancel loading (do not merge, use only values in memory)": [() => {
                            printError("File load aborted by user.");
                            dirtyData = true;
                        }, false]
                    }
                    var choice = printMenu(mergeChoices);
                    mergeChoices[choice][0]();
                } while (mergeChoices[choice][1]);
            }
        } else {
            console.log("Config does not exist on disk, using default.");
        }
    },
    "Save config to disk": () => {
        if (fs.existsSync(configFilename)) {
            fs.renameSync(configFilename, configFilename + "-backup");
            fs.writeFileSync(configFilename, JSON.stringify(options));
        }
        else {
            fs.writeFileSync(configFilename, JSON.stringify(options));
        }
        dirtyData = false;
        console.log("Saved data to disk.");
    },
    "Change option": () => {
        var option = readline.question("Enter the option you would like to change: ");
        if (options[option] != undefined) {
            options[option] = !options[option];
            console.log("Updated value " + option + ", is now " + options[option]);
            dirtyData = true;
        } else {
            console.log("Value " + option + " does not exist.");
        }
    },
    "Record now": () => {
        if (fs.existsSync("playbackfiles/" + macroName)) {
            fs.rmdirSync("playbackfiles/" + macroName, {recursive: true});
        }
        fs.mkdirSync("playbackfiles/" + macroName);
        fs.mkdirSync("playbackfiles/" + macroName + "/images");
        io.registerShortcut(stopKeybind, () => {
            io.stop();
            process.exit();
        });
        io.registerShortcut(screenshotKeybind, () => {
            // move the mouse out of the way
            var mousePos = robot.getMousePos(); 
            robot.moveMouse(-9999, 9999);
            var filename = "playbackfiles/" + macroName + "/images/" + (new Date()).getTime() + ".png";
            screenshot({filename: filename }).then(img => { 
                robot.moveMouse(mousePos.x, mousePos.y) 
                console.log("Saved screenshot in " + filename);
            });
        });
        Object.keys(options).forEach(value => {
            if (options[value]) {
                console.log("Binding to " + value);
                io.on(value, data => {
                    if (!recording) return;
                    if (lastAction == undefined) {
                        lastAction = new Date();
                    }
                    else {
                        var newDate = new Date();
                        // Needs to be blocking so that actions don't start appearing out of order
                        var ms = (newDate - lastAction);
                        var waitObj = {type: "wait", ms: ms}
                        fs.appendFileSync("playbackfiles/" + macroName + '/playbackfile.txt', JSON.stringify(waitObj) + "\n");
                        console.log(waitObj);
                        // we don't use newDate in case it took a long time to write the file for some reason
                        lastAction = new Date();
                    }
                    console.log(data);
                    fs.appendFileSync("playbackfiles/" + macroName + '/playbackfile.txt', JSON.stringify(data) + "\n");
                })
            } else {
                console.log(value + " is disabled in config.");
            }
        });
        recording = true;
        io.start();
        console.log("Use ctrl+shift+g to stop recording. Use ctrl+shift+f to take a screenshot for matching later.");
   },
    "Quit": () => {
        console.log("You can also use ctrl+c any time (recordings will be saved if mid-record)");
        process.exit();
    }
}

function main() {
    // Make the text white (I like it more that way)
    console.log(textColor);

    macroName = process.argv[2];
    if (process.argv[2] == undefined) {
        printError("No macro name passed as an argument, using 'default'");
        macroName = "default";
    }
    if (!fs.existsSync("playbackfiles/")) fs.mkdirSync("playbackfiles/");
    mainMenu["Reload config"]();
    mainMenu["Show config"]();
    printError("Setup complete! Don't forget to disable flux!");
    var choice;
    while (choice != "Record now") {
        printLogo();
        if (dirtyData) {
            printError("The current config will apply for this session only, save it to disk to make it permanant.");
        }
        choice = printMenu(mainMenu);
        mainMenu[choice]();
    } 
}

function printLogo() {
    printColor("--------------------");
    process.stdout.write("\x1b[35m");
    process.stdout.write(" MacroJS ");
    printColorLine("--------------------");
}

function printError(message) {
    console.log("\x1b[31m(!) " + textColor + message);
}

function printColor(message) {
    process.stdout.write("\x1b[36m");
    process.stdout.write(message);
    process.stdout.write(textColor);
}

function printColorLine(message) {
    printColor(message + "\n");
}

/* menu is an object that typically looks like this:
{
    "Option one": () => { // code to run when the user selects this option },
    "Option two": () => { // code to run when the user selects this option },
    ...
}
The keys can be any stringable object, and the values can be anything you want. This function does not consider the values, it just returns the user's selection
*/
function printMenu(menu) {
    while (1) {
        var keys = Object.keys(menu);
        for (var count = 0; count < keys.length; count++) {
            console.log(count + ": " + keys[count]);
        }
        printColor("Choose an option (0-" + (keys.length - 1) + "): ");
        var res = readline.questionInt();
        if (menu[keys[res]]) {
            return keys[res];
        }
        printError("Invalid option.");
    }
}

main();