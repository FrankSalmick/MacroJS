const $ = require('jquery');
const fs = require('fs');
const crop = require('cropperjs');
const imgSize = require('image-size');
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
        saveItem(event.target);
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
            // Goal: Get this in the console {"type": "regionmatch", "filename": "example.png", "location": { }}
            clone.find(".event-details").first().text("Matched a region");
            var imageSize = imgSize('example.png');
            var image = clone.find(".event-screenshot")[0];
            $(image).attr("src", eventData.filename);
            var cropper = new crop(image, {
                scalable: true,
                zoomable: true,
                minContainerWidth: Math.min($(window).width() - 200, imageSize.width),
                minContainerHeight: Math.min($(window).height() - 200, imageSize.height),
            });
            clone.find('.event-screenshot-add-region').on('click', () => {
                var json = JSON.parse(clone.find('textarea').val());
                if (json.locations == undefined) return; 
                var cropData = cropper.getData();
                // Get rid of data I don't care about
                var unwantedData = ["rotate", "scaleX", "scaleY"];
                unwantedData.forEach(item => delete cropData[item]);
                // Round values 
                Object.keys(cropData).forEach(item => cropData[item] = cropData[item].toFixed(3))
                json.locations.push(cropData);
                clone.find('textarea').val(JSON.stringify(json));
            });
            eventData.cropper = cropper;
        }
    }
    autofillFunctions[eventData.type](clone);
    return clone;
}

function main() {
    // Attach to the save button
    $("#header").on('click', event => {
        // Save 
        dataIsDirty(false);
    });
    // Ingest the data
    recordingData = fs.readFileSync("playbackfile.txt").toString().split("\n");
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