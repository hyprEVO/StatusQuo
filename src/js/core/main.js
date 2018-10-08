/**
 * Main.js
 * Misc global scripting.
 *
 *
 * @license -
 * @version 0.0beta
 * @author  hyprEVO Engineering: Lance Porter
 *
 *
 */

//------------------METHODS------------------//

var globalData = {};
var allEpisodes = $('.singleEpisode');
var allIcons = $('.singleEpisode__playButton i.fa');

globalData.state = 'closed';


//Helper function to extract img path from rss content
Handlebars.registerHelper('extractURL', function (url) {
    var tmp = document.createElement('div');
    tmp.innerHTML = url;
    var elem = tmp.getElementsByTagName('img')[0];
    return elem['src'];
});


//Easy method for handlebars rendering
function doHandlebars(data, template, container, place) {
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

//Easy method for encoding url then injecting needed YQL script to get feed
function loadFeed(url, key) {

    var encoded = encodeURIComponent(url);
    // https://developer.yahoo.com/yql/console/
    //JSON encoded RSS feed URL
    // var GSjson = "'https%3A%2F%2Fwww.gamespot.com%2Ffeeds%2Fnews%2F'";
    // var GIjson = "'http%3A%2F%2Fwww.gameinformer.com%2Fb%2Fmainfeed.aspx%3FTags%3Dnews'";
    // var IGjson = "'http%3A%2F%2Ffeeds.ign.com%2Fign%2Fgames-articles%3Fformat%3Dxml'";
    // var gplus = "'https%3A%2F%2Fgplusrss.com%2Frss%2Ffeed%2F401998a8df00674724fd89e57dc54d8e5a5fcbc8589f4'";
//Queries yahoo API AND initiates callback
    var concatFeedUrl = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20feednormalizer%20where%20url%3D'" + encoded + "'%20and%20output%3D'atom_1.0'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=handleResponse" + key;

    injectScript(concatFeedUrl);

}

//Method that injects a script with proper dynamic ref using YQL to translate RSS into JSON
function injectScript(url) {
    var scriptElement = document.createElement('script');
    scriptElement.type = 'text/javascript';
    scriptElement.src = url;
    $('head').append(scriptElement);
}

//-- RSS RESPONSE METHODS --
//Methods used by inject script on how to handle the JSON response, includes key for different response
//SQ RSS Feed
function handleResponseSQfeed(response) {
    var cleanData = response.query.results.feed.entry;
    var subTitle = response.query.results.feed.subtitle["0"];
    var contentObj = [{subTitle: subTitle}];

    //make global data relevent
    globalData.response = response.query.results.feed.entry;
    var numberOfEpisodes = globalData.response.length + 1;

    for (var i = 0; i < globalData.response.length; i++) {
        var episodeNumber = numberOfEpisodes - i;
        var introString = 'Straight Games, No Filler: Marz V and Queasy Crayfish present STATUS QUO';
        var introStringAlt = 'Marz Vindicator and Queasy Crayfish present Status Quo: Straight Games, No Filler.';
        var introStringAlt2 = 'Marz Vindicator and Queasy Crayfish present Status Quo, your weekly podcast for gaming trends past and present!';
        console.log(numberOfEpisodes - i, globalData.response[i]);
        globalData.response[i].episodeNumber = episodeNumber;
        if(globalData.response[i].hasOwnProperty('description')){
            var descPath = globalData.response[i].description.content;
            var firstPass = descPath.replace(introString,' ');
            var secondPass = firstPass.replace(introStringAlt,' ');
            var thirdPass =  secondPass.replace(introStringAlt2,' ');
            globalData.response[i].description.content = secondPass.replace(introStringAlt2,' ');
        }else {
            globalData.response[i].description = {};
            globalData.response[i].description.content = globalData.response[i].title;

        }
    }

    console.log('global data', globalData);

    //feat episode
    doHandlebars(globalData.response.slice(0, 1), "#js-template-featEpisode", ".js-render-featEpisode", "html");

    doHandlebars(globalData.response.slice(1, 9), "#js-template-singleEpisode", ".js-render-singleEpisode", "html");

    //Subtext
    doHandlebars(contentObj, "#js-template-bodyText", ".js-render-bodyText", "html");
    console.log('cleandata', cleanData);
    console.log('contentObj', contentObj);

    $('.js-audio').mediaelementplayer({
        features: ['playpause', 'progress', 'current', 'tracks', 'fullscreen']
    });
}

function updateButtonText() {
    if (globalData.state === 'open') {
        $('.js-load-btn').html('Hide Epidsodes');
        return
    }
    $('.js-load-btn').html('Show More Epidsodes');
}
function loadMoreSQ() {
    var cleanData = globalData.response;
    if (globalData.state === 'closed') {
        doHandlebars(cleanData.slice(7, 100), "#js-oldEp-template", ".js-testData-wrap", "append");
        toggleState();
        updateButtonText();
    } else {
        doHandlebars(cleanData.slice(1, 7), "#js-oldEp-template", ".js-testData-wrap", "html");
        toggleState();
        updateButtonText();
    }
}
function toggleState() {
    if (globalData.state === 'open') {
        globalData.state = 'closed';
    } else {
        globalData.state = 'open'
    }

    console.log('state', globalData.state);
}
function turnOffFeat() {
    var playBtn = $('.featEpisode .mejs-playpause-button');
    if (playBtn.hasClass('mejs-pause')) {
        playBtn.trigger('click');
    }
}
function triggerSingleAudio(instance) {
    var parentIndex = instance.closest('.singleEpisode').index();
    var playBtn = $('.singleEpisode').eq(parentIndex).find($(' .mejs-playpause-button'));

    playBtn.click();


}
function turnOffSingles() {
    var allEpisodes = $('.singleEpisode');
    allEpisodes.each(function () {
        if ($(this).attr('data-state') === "on") {
            $(this).find('.js-single-playButton').trigger('click');
        }
    });

}
function handleOnState(instance) {
    var thisEpisode = instance.closest('.singleEpisode');
    var icon = instance.children('i');
    // turnOffFeature();
    //Reset all episodes

    allEpisodes.removeClass('singleEpisode--state-playing');
    allEpisodes.attr('data-state', 'off');

    //Turn on this episode
    thisEpisode.addClass('singleEpisode--state-playing');
    thisEpisode.attr('data-state', 'on');

    //Change button state
    allIcons.removeClass('fa-pause').addClass('fa-play');
    icon.removeClass('fa-play').addClass('fa-pause');


}
function handleOffState(instance) {
    var thisEpisode = instance.closest('.singleEpisode');
    var icon = instance.children('i');
    //
    thisEpisode.removeClass('singleEpisode--state-playing');
    thisEpisode.attr('data-state', 'off');
    //
    allIcons.removeClass('fa-pause').addClass('fa-play');
    icon.removeClass('fa-pause').addClass('fa-play');

}
function scrollTest() {
    var scrollCap = $(window).scrollTop();
    if (scrollCap >= 200) {
        $('.js-top').removeClass('state-hide');

    } else {
        $('.js-top').addClass('state-hide');
    }

}

//------------------DOC READY------------------//
$(document).ready(function () {

    $(window).scroll(function () {
        scrollTest();
    });


    // Smooth scroll
    $(".js-top").click(function (e) {
        e.preventDefault();

        var position = $($(this).attr("href")).offset().top;

        $("body, html").animate({
            scrollTop: position
        } /* speed */);
    });

    //Load Podcast feed
    loadFeed("https://www.spreaker.com/show/3133182/episodes/feed", "SQfeed");

    //Load more episodes click event
    $('.js-load-btn').on('click', function () {
        loadMoreSQ();
    });

    $('body').on('mousedown', '.mejs-button', function () {
        turnOffSingles();
    });

    $(document).on('click', '.js-single-playButton', function () {
        if ($(this).closest('.singleEpisode').attr('data-state') === 'off') {
            handleOnState($(this));
        } else {

            handleOffState($(this));
        }
        turnOffFeat();
        triggerSingleAudio($(this));
    });
    //Initialize audo element

});