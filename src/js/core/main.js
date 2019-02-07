/**
 * Main.js
 * Misc global scripting.
 * @author  Lance Porter
 *
 *
 */
//------------------------------------VARIABLES------------------------------------//

//Global object where state and episode data is stored
var globalData = {};

//We'll see about these guys
var allEpisodes = $('.singleEpisode');
var allIcons = $('.singleEpisode__playButton i.fa');

//Set default state to closed (number of episodes displayed)
globalData.state = 'closed';


//------------------------------------METHODS------------------------------------//

//----------------------CORE RENDER METHODS----------------------//

//Easy method for handlebars rendering
function renderModule(data, template, container, place) {
    var theTemplate = $(template).html();
    var compiledTemplate = Handlebars.compile(theTemplate);
    if (place === "prepend") {
        $(container).prepend(compiledTemplate(data));
    } else if (place === "append") {
        $(container).append(compiledTemplate(data));
    } else {
        $(container).html(compiledTemplate(data));
    }
}

//Method that creates a script element in the dom that executes YQL query
function injectScript(url) {
    var scriptElement = document.createElement('script');
    scriptElement.type = 'text/javascript';
    scriptElement.src = url;
    $('head').append(scriptElement);
}

//Method accepts a url and a 'key' that acts as a suffix
//Encodes url then concats that with YQL url query
// If data is retrieved successfully then it fires a callback...using the key suffix allows for multiple callbacks to be easily created
function loadFeed(url, key) {
    var encoded = encodeURIComponent(url);
    var queryOpen = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20feednormalizer%20where%20url%3D'";
    var queryClose = "'%20and%20output%3D'atom_1.0'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=handleResponse";

    //Queries yahoo API AND initiates callback
    var concatFeedUrl = queryOpen + encoded + queryClose + key;
    injectScript(concatFeedUrl);
}

//Callback function from loadFeed() that takes in the succesful response data as an arg
function handleResponseSQfeed(response) {

    //Store episode data in globalData object
    globalData.episodeData = response.query.results.feed.entry;

    //Traverse object and find subtitle  then store it in its own arrray for passing into render function
    var subTitle = [{subTitle: response.query.results.feed.subtitle["0"]}];

    //Establish and store number of episodes based on returned data (add 1 since the array is 0 indexed)
    var numberOfEpisodes = globalData.episodeData.length + 1;

    //Traverse through each episode object in epdata array
    for (var i = 0; i < globalData.episodeData.length; i++) {
        var stringsToRemove = {};

        //Calculate instance episode number and store in new property
        globalData.episodeData[i].episodeNumber = numberOfEpisodes - i;

        //Strings I want removed episode descriptions
        stringsToRemove.string1 = 'Straight Games, No Filler: Marz V and Queasy Crayfish present STATUS QUO';
        stringsToRemove.string2 = 'Marz Vindicator and Queasy Crayfish present Status Quo: Straight Games, No Filler.';
        stringsToRemove.string3 = 'Marz Vindicator and Queasy Crayfish present Status Quo, your weekly podcast for gaming trends past and present!';

        //Check to see if instance has desc property..if so remove
        if (globalData.episodeData[i].hasOwnProperty('description')) {
            var descPath = globalData.episodeData[i].description.content;
            var firstPass = descPath.replace(stringsToRemove.string1, ' ');
            var secondPass = firstPass.replace(stringsToRemove.string2, ' ');
            globalData.episodeData[i].description.content = secondPass.replace(stringsToRemove.string3, ' ');
        } else {
            //If no description then set the title as description instead
            globalData.episodeData[i].description = {};
            globalData.episodeData[i].description.content = globalData.episodeData[i].title;
        }
    }

    //Render subtitle
    renderModule(subTitle, "#js-template-bodyText", ".js-render-bodyText", "html");
    //Render featured episode (get latest entry from array)
    renderModule(globalData.episodeData.slice(0, 1), "#js-template-featEpisode", ".js-render-featEpisode", "html");
    //Render the next 8 single episodes
    console.log("globalData", globalData);
    renderModule(globalData.episodeData.slice(1, 9), "#js-template-singleEpisode", ".js-render-singleEpisode", "html");

    //Initialize medialayer audio elements since they are dynamic...
    renderAudio('all');
}

//Method that initializes audio elements
function renderAudio(context) {
    if (context === 'all') {
        $('.js-audio').mediaelementplayer({
            features: ['playpause', 'progress', 'current', 'tracks', 'fullscreen']
        });
    } else {
        $('.js-audio-single').mediaelementplayer({
            features: ['playpause', 'progress', 'current', 'tracks', 'fullscreen']
        });
    }

}

//Load more button methods
function updateButtonText() {
    if (globalData.state === 'open') {
        $('.js-loadButton-text').html('Hide Episodes');
        $('.js-load-btn').addClass('loadButton--minus').removeClass('loadButton--plus');
        return
    }
    $('.js-loadButton-text').html('Show More Episodes');
    $('.js-load-btn').removeClass('loadButton--minus').addClass('loadButton--plus');
}
function loadMoreSQ() {
    var cleanData = globalData.episodeData;
    if (globalData.state === 'closed') {
        renderModule(cleanData.slice(1, 100), "#js-template-singleEpisode", ".js-render-singleEpisode", "html");
        toggleState();
        updateButtonText();
    } else {
        renderModule(cleanData.slice(1, 9), "#js-template-singleEpisode", ".js-render-singleEpisode", "html");
        toggleState();
        updateButtonText();
    }
    //Initialize medialayer audio elements since they are dynamic...
    renderAudio('single');
}
function toggleState() {
    if (globalData.state === 'open') {
        globalData.state = 'closed';
    } else {
        globalData.state = 'open'
    }
}


//----------------------MEDIA STATE METHODS----------------------//

//If the pause button exist click it on featured episode
function turnOffFeat() {
    var playBtn = $('.featEpisode .mejs-playpause-button.mejs-pause');
    playBtn.trigger('click');
}
//Find any playing element by class. change the state and pause the audo
function turnOffSingles() {
    $('.singleEpisode--state-playing').attr('data-state', 'off').removeClass('singleEpisode--state-playing').find($('.mejs-pause')).click();

}
//Take instance as an arg
function turnOnEpisode(instance) {
    var allEpisodes = $('.singleEpisode');
    var thisEpisode = instance.closest('.singleEpisode');

    //Reset all episodes
    allEpisodes.removeClass('singleEpisode--state-playing');
    allEpisodes.attr('data-state', 'off');

    //Turn on this episode
    thisEpisode.addClass('singleEpisode--state-playing');
    thisEpisode.attr('data-state', 'on');

    playAudio(instance);
}
function turnOffEpisode(instance) {
    var thisEpisode = instance.closest('.singleEpisode');

    thisEpisode.removeClass('singleEpisode--state-playing');
    thisEpisode.attr('data-state', 'off');
    pauseAudio(instance);
}

function playAudio(instance) {
    var parentIndex = instance.closest('.singleEpisode').index();
    var playBtn = $('.singleEpisode').eq(parentIndex).find($('.mejs-play'));
    playBtn.click();
    turnOffFeat();
}
function pauseAudio(instance) {
    var parentIndex = instance.closest('.singleEpisode').index();
    var pauseBtn = $('.singleEpisode').eq(parentIndex).find($('.mejs-pause'));
    pauseBtn.click();

}

//----------------------UI METHODS----------------------//
function toggleScrollTop() {
    var scrollCap = $(window).scrollTop();
    if (scrollCap >= 200) {
        $('.js-top').removeClass('state-hide');
    } else {
        $('.js-top').addClass('state-hide');
    }
}


//----------------------PAGE LIFECYCLE METHODS----------------------//
$(window).scroll(function () {
    toggleScrollTop();
});

$(document).ready(function () {
    //Load Podcast feed
    loadFeed("https://www.spreaker.com/show/3133182/episodes/feed", "SQfeed");
    var pdEventData = {
        theEvents: [
            {
                "Name": "Advocacy",
                "URL": "/about-the-industry/policy-priorities/Advocacy",
                "Image": "http://lancegd.com/CLIA-test/EP%20Logos/Maritime/Maritime-_0007_1.jpg"
            },
            {
                "Name": "Cruise Industry Regulation",
                "URL": "/about-the-industry/policy-priorities/Cruise%20Industry%20Regulation",
                "Image": "http://lancegd.com/CLIA-test/EP%20Logos/Maritime/Maritime-_0006_2.jpg"
            },
            {
                "Name": "Environmental Stewardship",
                "URL": "/about-the-industry/policy-priorities/Environmental%20Stewardship",
                "Image": "http://lancegd.com/CLIA-test/EP%20Logos/Maritime/Maritime-_0005_3.jpg"
            },
            {
                "Name": "Safety at Sea",
                "URL": "/about-the-industry/policy-priorities/Safety%20at%20Sea",
                "Image": "http://lancegd.com/CLIA-test/EP%20Logos/Maritime/Maritime-_0004_4.jpg"
            },
            {
                "Name": "Security at Sea",
                "URL": "/about-the-industry/policy-priorities/Security%20at%20Sea",
                "Image": "http://lancegd.com/CLIA-test/EP%20Logos/Maritime/Maritime-_0003_5.jpg"
            },
            {
                "Name": "Public Health and Medical",
                "URL": "/about-the-industry/policy-priorities/Public%20Health%20and%20Medical",
                "Image": "http://lancegd.com/CLIA-test/EP%20Logos/Maritime/Maritime-_0002_6.jpg"
            },
            {
                "Name": "Cruise Ship Accessibility for Persons with Disabilities",
                "URL": "/about-the-industry/policy-priorities/Cruise%20Ship%20Accessibility%20for%20Persons%20with%20Disabilities",
                "Image": "http://lancegd.com/CLIA-test/EP%20Logos/Maritime/Maritime-_0001_7.jpg"
            },
            {
                "Name": "CLIA Oceangoing Cruise Line Policies",
                "URL": "/about-the-industry/policy-priorities/CLIA%20Oceangoing%20Cruise%20Line%20Policies",
                "Image": "http://lancegd.com/CLIA-test/EP%20Logos/Maritime/Maritime-_0000_8.jpg"
            }
        ]
    };
    console.log(pdEventData.theEvents);

    renderModule(pdEventData.theEvents, "#test-node", ".filter-results", "html");

    // Scroll to top button event
    $(".js-top").click(function (e) {
        e.preventDefault();

        var position = $($(this).attr("href")).offset().top;

        $("body, html").animate({
            scrollTop: position
        } /* speed */);
    });

    //Dynamic element binding event for any play button
    $('body').on('mousedown', '.featEpisode .mejs-button', function () {
        turnOffSingles();
    });

    //THIS IS WHATS FUCKED UP
    $(document).on('click', '.js-single-playButton', function () {
        if ($(this).closest('.singleEpisode').attr('data-state') === 'off') {
            turnOnEpisode($(this));
        } else {
            turnOffEpisode($(this));
        }
    });


    // //Load more episodes click event
    $('.js-load-btn').on('click', function () {
        loadMoreSQ();
    });


});