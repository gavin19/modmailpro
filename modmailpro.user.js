// ==UserScript==
// @name    Mod Mail Pro
// @namespace    reddit.com/r/agentlame
// @author  agentlame, creesch, DEADB33F, gavin19
// @description Filter subs from mod mail.
// @match   http://*.reddit.com/message/moderator
// @match   https://*.reddit.com/message/moderator
// @include http://*.reddit.com/message/moderator
// @include https://*.reddit.com/message/moderator
// @match   http://*.reddit.com/message/moderator*
// @match   https://*.reddit.com/message/moderator*
// @include http://*.reddit.com/message/moderator*
// @include https://*.reddit.com/message/moderator*
// @match   http://*.reddit.com/message/moderator/*
// @match   https://*.reddit.com/message/moderator/*
// @include http://*.reddit.com/message/moderator/*
// @include https://*.reddit.com/message/moderator/*
// @version 1.0
// ==/UserScript==

function main() {

var modmailPro = {
    //
    // Enter the subs below
    //
    filtersubs : ["funny", "wtf", "SRDBroke", "MODclub", "football", "gavin19", "quakenet"],

    go: function() {
        modmailPro.addCSS();
        
        // Map subs to lowercase for more accurate comparison
        modmailPro['filtersubs'] = $.map(modmailPro['filtersubs'], function(e) {
            return e.toLowerCase(); 
        });
        
        // add filter button
        $('<span style="color:gray">  |  </span><a href="javascript:;" class="filter-link">filter</a>').appendTo('.spacer').click(modmailPro.filter);

        // underline on hover.     
        $("a.filter-link").hover(function () {
            $(this).css('text-decoration', 'underline');
        }, function () {
            $(this).css('text-decoration', 'none');
        });
        
        modmailPro.highlightUnread();
        modmailPro.collapseThreads();
        modmailPro.addListener();
    },
    addCSS: function(){
        var css = ".messages-page .message-parent, .messages-page .thing.spam {\n    background-color:transparent!important;\n}   .thing.spam .entry .noncollapsed .tagline .head {\n    color: red !important;\n}";
        var style = document.createElement('style');
        style.type = "text/css";
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    },
    addListener: function() {
        // Add listener for the 'all' button to cover NER
        $('.menuarea li:first-child a').on('click', function() {
            $('.message-parent').css('display','');
        });
        // Listen for pages added in with NER
        document.body.addEventListener('DOMNodeInserted', function(e){
            if (e.target.parentNode.id && e.target.parentNode.id === 'siteTable'){
                var f = e.target.parentNode.querySelectorAll('.sitetable[id*="siteTable-"]:last-child > .message-parent');
            }
            if (e.target.parentNode.id && e.target.parentNode.id === 'siteTable'){
                var e = e.target.parentNode.querySelectorAll('.sitetable[id*="siteTable-"]:last-child > .message-parent');
                if (document.querySelector('.mmp-collapsed')){
                    //modmailPro.collapseAll(e);
                }
                if (document.querySelector('.mmp-expanded')){
                    //modmailPro.expandAll(e);
                }
                if ($('.menuarea li').eq(1).is('.selected')){
                    //$(e).hide();
                }
            }
        });
    },
    filter: function() {
        var $link = $('.filter-link');

        // make look selected.
        $link.css({
            "color": "orangered",
            "font-weight": "bold"
        });

        // Hide threads
        modmailPro.setViewState('none');
        
        // Add class to body
        $('body').addClass('mmp-filtered');

        // Rebind filter button
        $link.unbind('click').click(modmailPro.unfilter);
        $link.text('unfilter')
    },
    unfilter: function() {
        var $link = $('.filter-link');

        // make look unselected.
        $link.css({
            "color": "#369",
            "font-weight": "normal"
        });

        // Show threads.
        $('.message-parent').css('display','');
        
        // Remove class from body
        $('body').removeClass('mmp-filtered');

        // Rebind filter button.
        $link.unbind('click').click(modmailPro.filter);
        $link.text('filter')
    },
    setViewState: function(state, target) {
        var $links = target ? $(target) : $('.message-parent');
        // filter messages from matching subs
        $links.each(function () {
            var subname = $(this).find('.correspondent a').text().replace('/r/', '').replace('[-]', '').replace('[+]', '').trim().toLowerCase();
            if ($.inArray(subname, modmailPro['filtersubs']) != -1) {
                $(this).css('display','none');
            }
        });
    },
    highlightUnread: function() {
        var ALL = 0,
            UNREAD = 1,
            now = new Date().getTime(),
            last = JSON.parse(localStorage['modmail_last_visited']) || {},
            count = 0,
            user = reddit.logged,
            page = localStorage['modmail_page'] || ALL;

        // Highlight unread messages
        $('.thing.message .entry').each(function () {
            var thing = $(this),
                subreddit = thing.find('.head a:last').text().slice(3, -1),
                timestamp = new Date(thing.find('.head time').attr('datetime')).getTime();
            if (timestamp > last[subreddit]) {
                thing.addClass('new').css('background-color', '#fdc');
                count++;
            };
        });

        // Display number of unread messages
        $('.menuarea')
            .append('<span><b>' + count + '</b> - new message' + (count == 1 ? '' : 's'))
            .find('a').click(function () {
            modmailPro.hideOld(this.textContent == 'all' ? 0 : 1);
            return false;
        });

        // Hide read messages
        modmailPro.hideOld(page);

        // Update last read times
        $('.correspondent.reddit').text(function (_, sr, c) {
            last[sr.slice(3)] = now;
        });
        localStorage['modmail_last_visited'] = JSON.stringify(last);
    },
    hideOld: function(bool) {
        //console.log('bool:',bool)
        $('.menuarea li').removeClass('selected').eq(bool).addClass('selected');

        if (bool * 1) $('#siteTable>.message').hide().has('.entry.new').show();
        else $('#siteTable>.message').show();

        localStorage['modmail_page'] = bool;
    },
    collapseThreads: function() {
        // add collapse button
        $('<span style="color:gray">  |  </span><a href="javascript:;" class="collapse-all-link">collapse all</a>').appendTo('.spacer').click(modmailPro.collapseAll);

        $("a.collapse-all-link").hover(function () {
            $(this).css('text-decoration', 'underline');
        }, function () {
            $(this).css('text-decoration', 'none');
        });

        $('.message-parent').each(function () {
            $(this).find('.correspondent a').parent().prepend('<a href="javascript:;" class="collapse-link">[-]</a> ');
            var count = $(this).find('.entry').length - 1;

            if (count > 0) {
                $('<span>[' + count + '] </span>').insertAfter($(this).find('.correspondent:first'));
            }
        });

        $('body').delegate('.collapse-link', 'click', function () {
            var parent = $(this).closest('.message-parent');
            if ($(this).text() === '[-]') {
                parent.find('.entry, .expand-btn').hide();
                $(this).text('[+]');
            } else {
                parent.find('.entry, .expand-btn').show();
                $(this).text('[-]');
            }
        });
    },
    collapseAll: function(target) {
        var $link = $('.collapse-all-link'),
            $links = target ? $(target) : $('.message-parent');
        // make look selected.
        $link.css({
            "color": "orangered",
            "font-weight": "bold"
        });

        // Hide threads.
        $links.each(function () {
            $(this).find('.entry, .expand-btn').hide();
        });
        
        // Add class to body
        $('body').addClass('mmp-collapsed');

        // Rebind filter button.
        $link.unbind('click').click(modmailPro.expandAll);
        $link.text('expand all');
        $('.collapse-link').text('[+]');
    },
    expandAll: function() {
        var $link = $('.collapse-all-link');

        // make look unselected.
        $link.css({
            "color": "#369",
            "font-weight": "normal"
        });

        // Show threads.
        $('.message-parent').each(function () {
            $(this).find('.entry, .expand-btn').show();
        });
        
        // Remove class from body
        $('body').removeClass('mmp-expanded');

        // Rebind filter button.
        $link.unbind('click').click(modmailPro.collapseAll);
        $link.text('collapse all');
        $('.collapse-link').text('[-]');
    }
}
modmailPro.go();
}

if ( location.pathname.match(/\/message\/(?:moderator)\/?/) ) {
    var scr = document.createElement('script');
    scr.type = "text/javascript";
    scr.textContent = '(' + main.toString() + ')();';
    document.body.appendChild(scr);
}
