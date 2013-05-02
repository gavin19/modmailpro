// ==UserScript==
// @name    Mod Mail Pro
// @namespace  reddit.com/r/agentlame
// @author	agentlame, creesch, DEADB33F, gavin19
// @description	Filter subs from mod mail.
// @match	http://*.reddit.com/message/moderator
// @match	https://*.reddit.com/message/moderator
// @include	http://*.reddit.com/message/moderator
// @include	https://*.reddit.com/message/moderator
// @match	http://*.reddit.com/message/moderator*
// @match	https://*.reddit.com/message/moderator*
// @include	http://*.reddit.com/message/moderator*
// @include	https://*.reddit.com/message/moderator*
// @match	http://*.reddit.com/message/moderator/*
// @match	https://*.reddit.com/message/moderator/*
// @include	http://*.reddit.com/message/moderator/*
// @include	https://*.reddit.com/message/moderator/*
// @version	1.0
// ==/UserScript==

function modmailfilter() {

    //
    // Enter the subs below
    //
    var filtersubs = ["funny", "wtf", "SRDBroke"];

    if (location.pathname.match(/\/message\/(?:moderator)\/?/)) {

        // add filter button
        $('<span style="color:gray">  |  </span><a href="javascript:;" class="filter-link">filter</a>').appendTo('.spacer').click(filter);

        // underline on hover.     
        $("a.filter-link").hover(function () {
            $(this).css('text-decoration', 'underline');
        }, function () {
            $(this).css('text-decoration', 'none');
        });
    }

    function filter() {
        var link = ('.filter-link');

        // make look selected.
        $(link).css({
            "color": "orangered",
            "font-weight": "bold"
        });

        // Hide threads
        setViewState('none');

        // Rebind filter button
        $(link).unbind('click').click(unfilter);
        $(link).text('unfilter')
    }

    function unfilter() {
        var link = ('.filter-link');

        // make look unselected.
        $(link).css({
            "color": "#369",
            "font-weight": "normal"
        });

        // Show threads.
        setViewState('block');

        // Rebind filter button.
        $(link).unbind('click').click(filter);
        $(link).text('filter')
    }

    function setViewState(state) {

        // filter messages from matching subs
        $('.message-parent').each(function () {
            var subname = $(this).find('.correspondent a').text().replace('/r/', '').replace('[-]', '').replace('[+]', '').trim();

            if ($.inArray(subname, filtersubs) != -1) {
                $(this).css('display', state);
            }
        });

    }
}

function highlightunread() {
    var ALL = 0,
        UNREAD = 1,
        now = new Date().getTime(),
        last = JSON.parse(localStorage['modmail_last_visited'] || '{}'),
        count = 0,
        user = reddit.logged,
        page = localStorage['modmail_page'] || ALL;

    // Highlight unread messages
    $('.thing.message .entry').each(function () {
        var thing = $(this),
            subreddit = thing.find('.head a:last').text().slice(3, -1),
            timestamp = new Date(thing.find('.head time').attr('datetime')).getTime();
        if (timestamp > last[subreddit]) {
            thing.addClass('new').css('background-color', '#FFFDCC');
            count++
        };
    });

    // Display numer of unread messages
    $('.menuarea')
        .append('<span><b>' + count + '</b> - new message' + (count == 1 ? '' : 's'))
        .find('a').click(function () {
        hideOld(this.textContent == 'all' ? 0 : 1);
        return false
    });

    // Hide read messages

    function hideOld(bool) {
        //console.log('bool:',bool)
        $('.menuarea li').removeClass('selected').eq(bool).addClass('selected');

        if (bool * 1) $('#siteTable>.message').hide().has('.entry.new').show();
        else $('#siteTable>.message').show();

        localStorage['modmail_page'] = bool;
    }
    hideOld(page);

    // Update last read times
    $('.correspondent.reddit').text(function (_, sr, c) {
        last[sr.slice(3)] = now
    });
    localStorage['modmail_last_visited'] = JSON.stringify(last);
}

function collapsethreads() {


    // add collapse button
    $('<span style="color:gray">  |  </span><a href="javascript:;" class="collapse-all-link">collapse all</a>').appendTo('.spacer').click(collapseall);

    $("a.collapse-all-link").hover(function () {
        $(this).css('text-decoration', 'underline');
    }, function () {
        $(this).css('text-decoration', 'none');
    });

    $('.message-parent').each(function () {
        $(this).find('.correspondent a').parent().prepend('<a href="javascript:;" class="collapse-link">[-]</a> ');
    });

    $('body').delegate('.collapse-link', 'click', function () {
        var parent = $(this).closest('.message-parent');
        if ($(this).text() === '[-]') {
            parent.find('.entry').hide();
            parent.find('.expand-btn').hide();
            $(this).text('[+]');
        } else {
            parent.find('.entry').show();
            parent.find('.expand-btn').show();
            $(this).text('[-]');
        }
    });

    function collapseall() {
        var link = ('.collapse-all-link');
        // make look selected.
        $(link).css({
            "color": "orangered",
            "font-weight": "bold"
        });

        // Hide threads.
        $('.message-parent').each(function () {
            $(this).find('.entry').hide();
            $(this).find('.expand-btn').hide();
        });

        // Rebind filter button.
        $(link).unbind('click').click(expandall);
        $(link).text('expand all')
        $('.collapse-link').text('[+]');
    }

    function expandall() {
        var link = ('.collapse-all-link');

        // make look unselected.
        $(link).css({
            "color": "#369",
            "font-weight": "normal"
        });

        // Show threads.
        $('.message-parent').each(function () {
            $(this).find('.entry').show();
            $(this).find('.expand-btn').show();
        });

        // Rebind filter button.
        $(link).unbind('click').click(collapseall);
        $(link).text('collapse all')
        $('.collapse-link').text('[-]');
    }
}

// Add scripts to page
(function () {

    // No red mod mail.
    var css = ".messages-page .message-parent, .messages-page .thing.spam {\n    background-color:transparent!important;\n}   .thing.spam .entry .noncollapsed .tagline .head {\n    color: red !important;\n}";
    var style = document.createElement('style');
    style.type = "text/css";
    style.appendChild(document.createTextNode(css))
    document.head.appendChild(style)

    // Add highlight unread
    var unred = document.createElement('script');
    unred.textContent = "(" + highlightunread.toString() + ')();';
    document.head.appendChild(unred)

    // Add filter button
    var filter = document.createElement('script');
    filter.textContent = "(" + modmailfilter.toString() + ')();';
    document.head.appendChild(filter)

    // Add collapse threads
    var hide = document.createElement('script');
    hide.textContent = "(" + collapsethreads.toString() + ')();';
    document.head.appendChild(hide)

})();
