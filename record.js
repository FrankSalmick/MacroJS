const io = require('iohook');
const readline = require('readline-sync');
const fs = require('fs');
const configFilename = "./record-config.txt";
const textColor = "\x1b[37m";
// ctrl shift g
var stopKeybind = [29, 42, 34];

var options = {
    "mouseclick": true,
    "keyup": true
};

var mainMenu = {
    "Show config": () => {
        console.log(options);
    },
    "Reload config": () => {
        if (fs.existsSync(configFilename)) {
            var diskConfig = fs.readFileSync("./record-config.txt");
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
            var mergeConfigs = function () {
                // We could just do options = JSON.parse(diskConfig), 
                // but instead we iterate over diskConfig so that we don't *lose* items in our config (which will probably cause problems down the road)
                Object.keys(diskConfig).forEach(value => {
                    options[value] = diskConfig[value];
                });
                console.log("Successfully imported config");
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
        io.registerShortcut(stopKeybind, () => {
            io.stop();
            process.exit();
        });
        Object.keys(options).forEach(value => {
            console.log("Binding to " + value);
            io.on(value, data => {
                if (options[value]) {
                    fs.appendFile('./playbackfile.txt', JSON.stringify(data) + "\n", (err) => { console.log(err); });
                }
            })
        });
        io.start();
        console.log("Use ctrl+shift+g to stop recording.");
    },
    "Quit": () => {
        console.log("You can also use ctrl+c any time.");
        process.exit();
    }
}

function main() {
    // Make the text white (I like it more that way)
    console.log(textColor);
    var dirtyData = false;

    mainMenu["Reload config"]();
    mainMenu["Show config"]();
    console.log("Setup complete!");
    var choice;
    while (choice != "Record now") {
        printLogo();
        if (dirtyData) {
            printError("Config has not been saved.");
        }
        var choice = printMenu(mainMenu);
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