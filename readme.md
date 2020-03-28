# MacroJS
MacroJS is a CLI macro recorder/player that supports waiting for content to appear on screen. It's written in NodeJS and is cross-platform. At this point it's almost ready to be called version 1, it just needs an easier install process, and the editor needs a real frontend.

# Screenshots

### Playback a simple macro (No image matching)

![simple macro](https://s5.gifyu.com/images/2020-02-17_23-50-14.gif)

### Playback a macro (image matching)

This macro waits for the image to appear before proceeding to the next operation (closing the image).

![macro playback gif](https://s5.gifyu.com/images/2020-02-17_23-47-57.gif)

### Playback a macro (Conditional jumping)

This macro will right-click on the right side of the screen if it does not see the image, and right-click on the left side of the screen if it does see the image.

![conditional jumping gif](https://s5.gifyu.com/images/2020-03-28_02-45-57.gif | height=550)

Here is the output at the very end, for reference:

![final output](https://i.imgur.com/RhvQtlz.png)

### Record a macro

![record.js screenshot](https://i.imgur.com/hBSvVyo.png)

# Usage

### Commands

- `node record.js <macron ame>` to record a macro. This will create a folder `playbackfiles/<macroname>`. This folder contains a file named `playbackfile.txt`, which is where your macro is saved (syntax and examples are in the [section below](#Playbackfile-syntax)). 
- `node playback.js <macro name>` to playback a macros (will read `playbackfile.txt` in `playbackfiles/<macro name>`).
- `npm start` to start the advanced macro editor (must be inside the /editor directory)
  - The macro editor will output a command you can insert into your playback file located in `playbackfiles/<macro name>/playbackfile.txt`. This playback file is also how you modify your macros. At this point I don't plan to expand the purpose of the editor.
  - The editor is usually what I update last, because it just outputs a string for you to insert into `playbackfile.txt`, which can be manually edited to fit any need. For example, there is no native support for generating a `checkRegion` command, but these can be made with just a few modifications the `regionMatch` command the editor generates. 
  
# Playbackfile syntax

### General

Playbackfile.txt is a list of newline-seperated json objects. Empty lines are ignored. The file will be interpreted from top to bottom, and MacroJS will replay the file 20 times (by default). All objects have the key `type`. The value of this key must be lowercase. All objects are assigned a key `index` at runtime, which will overwrite any existing `index` key. As long as an object has all its required keys, it can have any number of additional keys. These will simply be ignored by MacroJS.

### Note

The most basic command is note. It is simply skipped by the editor (after being printed). Example:

```{ "type": "note" }```

### Debug

This simply prints out the key `note`. Example:

```{ "type": "debug", "note": "Debugging with print statements is so much fun!" }```

### Mark and Jump

Mark will assign a name to the command that immediately follows. Jump is the equivilent of a goto, MacroJS will immediately jump to the named command and continue running from that command. Example:

```
{ "type": "mark", "name": "Pre-debug statement" }
{ "type": "debug", "note": "Debugging with print statements is so much fun!" }
{ "type": "jump", "jumpName": "Pre-debug statement" }
```

This macro will print out "Debugging with print statements is so much fun!" indefinitely. 

### ConditionalJump

ConditionalJump will jump if a condition is met. It will be easiest to show this off with an explained example:

```
{ "type": "mark", "name": "Pre-debug statement" }
{ "type": "debug", "note": "First" }
{"type":"conditionalJump", "jumpName": "Pre-debug statement", "jumpOnMatch": "true", "filename":"1585172997056.png","locations":[{"x":345,"y":1021,"width":27,"height":30}]}
{ "type": "debug", "note": "Second" }
```

This statement will always print out "First". Then, it will take a screenshot and compare the region (345, 1021) with a width and height of (27, 30). If this region matches the same region in the image provided, it will jump to Pre-debug statement. If `jumpOnMatch` were false, it would only make this jump if the region did not match. The first three lines could continue forever, but if eventually the region doesn't match, "Second" will finally be output.

In order for this command to function, the editor must be used. This is because the image is pre-cropped to prevent a second expensive cropping operation every time a comparison is made. I'll add more information about how to do this later.

### Wait

Wait will pause for any number of milliseconds before continuing to the next command. Example:

```{"type": "wait", "ms": 1000}```

### Mouseclick and Mouseup

Todo get rid of whichever one is left over from my experimenting

This will click at the (x, y) cordinate provided. Example:

```{"button":1,"clicks":1,"x":1590,"y":957,"type":"mouseup"}```

`button` is 1 for left-click, and 2 right right-click.

`clicks` is data that is generated by the recording library and not used by MacroJS. It can be omitted, but the recorder will include it by default.

`x` and `y` are the x and y cordinates, respectively

### Regionmatch

Regionmatch will wait until a region of the screen matches a screenshot before proceeding. Be careful with this, as it could lead to permanent lockups if the region is never matched. Example:

```{"type":"regionmatch","filename":"1582002300576.png","locations":[{"x":1455,"y":914,"width":367,"height":134}]}```

`locations` is an array because in the future I plan to support multiple areas. Right now, this is not supported. 

This command must also be generated with the editor. 

### Mousemove

Mousemove will move the mouse to an area of the screen, but not click. Example:

```{"type": "mousemove", "x": 493, "y": 392}```

### Keydown and keyup

Todo write this part

# Example playbackfile

Included in playbackfiles/ is the inspiration for this project, a macro named `lor` that will auto-concede against the AI in Legends of Runeterra. Use this to grind as many cards as you want! To use it, just select a deck (so [this menu](https://i.imgur.com/cco8yvj.png) is open) and run it with `node playback.js lor` in the root directory.

# Install 

### You will need NodeJS

https://nodejs.org/en/download/

### You will need the following npm packages installed in the root directory:

Install them by opening a command prompt in the root directory and run `npm i <package name>`, or use this command to install all of them:

> npm i readline-sync iohook robotjs screenshot-desktop looks-same sharp

- `readline-sync` because I wrote this project as a way of learning how to use Node, and didn't realize this was a pretty bad way of getting input. I'll refactor it out at some point.
- `iohook` so the recorder can listen to inputs on your keyboard/mouse
- `robotjs` so the player can play your inputs back
- `screenshot-desktop` so you can take screenshots to image match while recording, and so the player can take screenshots to compare with 
- `looks-same` so the player can determine if a region of your screen matches a screenshot
- `sharp` to crop screenshots

### You will need to run these commands inside the /editor directory to use the editor

To install all the dependencies for the editor, run

> npm i

To build sharp for electron, run

> npx electron-rebuild

At some point I'm going to refactor sharp out for something else because of this requirement.

### Why is there no precompiled binary?
I'll do that at some point. Right now MacroJS is still actively being developed so I don't want to recompile it every time I push an update (which is often more than daily)


# License

This is licensed under GPL3. More details are available in the LICENSE file. If you need a more permissive license, feel free to ask! Just let me know what you plan on doing :)
