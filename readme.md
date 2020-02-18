# MacroJS
MacroJS is a CLI macro recorder/player that supports waiting for content to appear on screen. It's written in NodeJS and is cross-platform. At this point it's almost ready to be called version 1, it just needs an easier install process and to support keypresses (the boilerplate is all there, there are just a few things I need to fix up)

# Screenshots

### Playback a simple macro (No image matching)

![simple macro](https://s5.gifyu.com/images/2020-02-17_23-50-14.gif)

### Playback a macro (image matching)

This macro waits for the image to appear before proceeding to the next operation (closing the image).

![macro playback gif](https://s5.gifyu.com/images/2020-02-17_23-47-57.gif)

### Record a macro

![record.js screenshot](https://i.imgur.com/cQzDkJ9.png)

# Usage

- `node record.js <macroname>` to record a macro
- `node playback.js <macroname>` to playback a macros
- `npm start` to start the advanced macro editor (must be inside the /editor directory)
  - The macro editor will output a command you can insert into your playback file located in `playbackfiles/<macroname>/playbackfile.txt`. This playback file is also how you modify your macros. At this point I don't plan to expand the purpose of the editor.

# Install 

### You will need the following npm packages installed in the root directory:

- `readline-sync` because I wrote this project as a way of learning how to use Node, and didn't realize this was a pretty bad way of getting input. I'll refactor it out at some point.
- `iohook` so the recorder can listen to inputs on your keyboard/mouse
- `robotjs` so the player can play your inputs back
- `screenshot-desktop` so you can take screenshots to image match while recording, and so the player can take screenshots to compare with 
- `looks-same` so the player can determine if a region of your screen matches a screenshot
- `sharp` to crop screenshots

Here's an easy command for you!

> npm i readline-sync iohook robotjs screenshot-desktop looks-same sharp

### You will need to run these commands inside the /editor directory to use the editor

To install all the dependencies for the editor, run

> npm i

To build sharp for electron, run

> npx electron-rebuild

At some point I'm going to refactor sharp out for something else because of this requirement.

### Why is this so hard to set up? 
I'm using this project to learn Node, I haven't spent time learning about its package manager yet. I'm sure it's pretty simple to get this to get done in one command, but I'll get to that later.
