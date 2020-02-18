// todo this is going to turn into more of just a single purpose app to select regions of images. I'd rather just edit the json directly, it's easier that way.
const $ = require('jquery');
const fs = require('fs');
const crop = require('cropperjs');
const imgSize = require('image-size');
// note, errors about The specified module could not be found just need an electron-rebuild.
const sharp = require('sharp');
var macroName = "lor2";
var recordingData; 
var events = {};
var dirtyData = false;

function dataIsDirty(isDirty) {
    dirtyData = isDirty;
    isDirty ? $("#dirty-data").show() : $("#dirty-data").hide();
}

function getTemplate(event) {
    var clone = $("#event-templates").find(".event-" + event.type).first().clone();
    var footerClone = $("#event-templates").find(".event-footer").first().clone();
    var optionsHeaderClone = $("#event-templates").find(".event-options-header").first().clone();
    clone.find('.event-options').first().prepend(optionsHeaderClone);
    var detailsClone = $("#event-templates").find(".event-details").first().clone();
    clone.prepend(detailsClone);
    
    // Setup delete button
    footerClone.find(".event-delete").first().on('click', clickedevent => {
        var parent = $(clickedevent.target).parentsUntil(".event").last().parent();
        var eventID = parent.attr('data-event-id');
        delete events[eventID];
        parent.remove();
        dataIsDirty(true);
    });

    // And save button
    footerClone.find(".event-save").first().on('click', event => {
        alert("Not yet finished.");
        dataIsDirty(true);
    });

    clone.find(".event-options").first().append(footerClone);
    clone.find(".event-raw").text(JSON.stringify(event));

    // Setup the click listeners
    clone.on('click', clickedevent => {
        $(clickedevent.currentTarget).find(".event-options").first().toggle();
        console.log(clickedevent.currentTarget);
    });
    clone.find(".event-options").first().on('click', event => {
        event.stopPropagation();
    });
    return clone;
}

// {"button":1,"clicks":1,"x":1734,"y":973,"type":"mouseup"}
// {"type":"wait","ms":41078}
function getFilledInTemplate(eventData) {
    var clone = getTemplate(eventData);
    var autofillFunctions = {
        // We don't need to pass clone because it will be inherited (this object shares the same scope, so they will always be in scope together)
        "mouseup": () => {
            clone.find(".event-details").first().text("Mouse up at x=" + eventData.x + " y=" + eventData.y);
        },
        "wait": () => {
            clone.find(".event-details").first().text("Waited for " + eventData.ms + "ms");
        },
        "regionmatch": () => {
            clone.find(".event-details").first().text("Matched a region");
            var filename = "../playbackfiles/" + macroName + "/images/" + eventData.filename;
            var imageSize = imgSize(filename);
            var image = clone.find(".event-screenshot")[0];
            $(image).attr("src", filename);
            var cropper = new crop(image, {
                scalable: true,
                zoomable: true,
                minContainerWidth: Math.min($(window).width() - 200, imageSize.width),
                minContainerHeight: Math.min($(window).height() - 200, imageSize.height),
            });
            clone.find('.event-screenshot-add-region').on('click', () => {
                var json = JSON.parse(clone.find('textarea').val());
                if (json.locations == undefined) return; 
                var allCropData = cropper.getData(true);
                // Only consider data I want
                var cropData = {};
                var wantedData = ["x", "y", "width", "height"];
                wantedData.forEach(item => cropData[item] = allCropData[item]);
                json.locations.push(cropData);
                clone.find('textarea').val(JSON.stringify(json));
                // Crop the picture and save it
                // https://stackoverflow.com/a/5971674/1524950
                // cropper.setCropBoxData({left: cropData.left, top: cropData.y + cropData.height, width: cropData.width, height: cropData.height});
                // We use a different library instead of getting it from cropper because this is the lib we use in playback.js. Cropper was giving me very slightly different images, which messed with the comparison step
                sharp(filename).extract({left: Number(cropData.x), top: Number(cropData.y), width: Number(cropData.width), height: Number(cropData.height)}).toFile(filename + "-" + cropData.x + "-" + cropData.y + "-" + cropData.width + "-" + cropData.height).then(data => {
                    dataIsDirty(true);
                });
            });
            eventData.cropper = cropper;
        }
    }
    autofillFunctions[eventData.type](clone);
    return clone;
}

function main() {
    // Attach to the save button
    $("#header").on('click', () => {
        alert("Not yet implemented.");    
        dataIsDirty(false);
    });
    // Ingest the data
    recordingData = fs.readFileSync("../playbackfiles/" + macroName + "/playbackfile.txt").toString().split("\n");
    for (var i = 0; i <= recordingData.length; i++) {
        try {
            record = JSON.parse(recordingData[i]);
        } catch (e) {
            continue;
        }
        events[i.toString()] = record;
        record.id = i.toString();
        var event = getFilledInTemplate(record);
        $(event).attr("data-event-id", i);
        $("#content").append(event);
    }
    // From now on we just reference events by their ID, we don't need to store the file in memory any more.
    delete recordingData;
}

main();