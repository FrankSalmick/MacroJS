// todo this is going to turn into more of just a single purpose app to select regions of images. I'd rather just edit the json directly, it's easier that way.
const $ = require('jquery');
const fs = require('fs');
const crop = require('cropperjs');
const imgSize = require('image-size');
// note, errors about The specified module could not be found just need an electron-rebuild.
const sharp = require('sharp');
var macroName;
var defaultText;
var cropperInstance;
var currentImage;

// https://stackoverflow.com/a/24594123/1524950
function getSubdirectories(dir) {
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

function selectMacro(newMacroName) {
    macroName = newMacroName;
    $("#imgSelect").empty();
    fs.readdirSync('../playbackfiles/' + macroName + '/images')
        .filter(value => value.endsWith(".png"))
        .forEach(value => {
        $("#imgSelect").append("<option value='" + value + "'>" + value + "</option>");
    });
    selectImage($("#imgSelect")[0].value);
}
$("#macros").on('change', eventData => { selectMacro(eventData.target[eventData.target.selectedIndex].value); });

function selectImage(selectedImage) {
    if (cropperInstance != undefined) cropperInstance.destroy();
    var filename = "../playbackfiles/" + macroName + "/images/" + selectedImage;
    currentImage = filename;
    var imageSize = imgSize(filename);
    var image = document.getElementById("event-screenshot");
    image.src = filename;
    cropperInstance = new crop(image, {
        scalable: true,
        zoomable: true
    });
}
$("#imgSelect").on('change', eventData => { selectImage(eventData.target[eventData.target.selectedIndex].value)});

$("#add").on('click', () => {
    var json = JSON.parse(defaultText);
    if (json.locations == undefined) json.locations = [];
    var allCropData = cropperInstance.getData(true);
    // Only consider data I want
    var cropData = {};
    var wantedData = ["x", "y", "width", "height"];
    wantedData.forEach(item => cropData[item] = allCropData[item]);
    json.locations.push(cropData);
    json.filename = currentImage.split("/images/")[1];
    $("#event-raw").text(JSON.stringify(json));
    // Crop the picture and save it
    // cropper.setCropBoxData({left: cropData.left, top: cropData.y + cropData.height, width: cropData.width, height: cropData.height});
    // We use a different library instead of getting it from cropper because this is the lib we use in playback.js. Cropper was giving me very slightly different images, which messed with the comparison step
    sharp(currentImage).extract({ left: Number(cropData.x), top: Number(cropData.y), width: Number(cropData.width), height: Number(cropData.height) }).toFile(currentImage + "-" + cropData.x + "-" + cropData.y + "-" + cropData.width + "-" + cropData.height);
});

function main() {
    // read in all macros
    getSubdirectories('../playbackfiles').forEach(value => {
        $("#macros").append("<option value='" + value + "'>" + value + "</option>");
    });

    defaultText = $("#event-raw").text();
    selectMacro($("#macros").val());
    selectImage($("#imgSelect").val());
}
$(document).ready(main);