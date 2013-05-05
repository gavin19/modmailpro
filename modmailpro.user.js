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
    filtersubs : ["funny", "wtf", "SRDBroke", "MODclub"],

    go: function() {
        modmailPro.addCSS();
        
        // Map subs to lowercase for more accurate comparison
        modmailPro['filtersubs'] = $.map(modmailPro['filtersubs'], function(e) {
            return e.toLowerCase(); 
        });
        
        // add filter button
        $('<span style="color:gray">  |  </span><a href="javascript:;" class="filter-link">filter</a>').appendTo('.spacer').click(modmailPro.filter);

        // underline on hover.     
        $(".filter-link").hover(function () {
            $(this).css('text-decoration', 'underline');
        }, function () {
            $(this).css('text-decoration', 'none');
        });
        
        // Start on 'unread' by default so make that link selected
        $('.menuarea li:first').removeClass('selected').find('a').addClass('all');
        $('.menuarea li:last').addClass('selected').find('a').addClass('unread');
        
        modmailPro.highlightUnread();
        modmailPro.collapseThreads();
        modmailPro.addListener();
    },
    mmpFiltered: false,
    mmpExpanded: true,
    addCSS: function(){
        var css = ".messages-page .message-parent, .messages-page .thing.spam {background-color:transparent!important;}";
        css += ".thing.spam .entry .noncollapsed .tagline .head {\n    color: red !important;\n}";
        css += ".menuarea .spacer .selected{color:orangered;font-weight:bold}";
        var style = document.createElement('style');
        style.type = "text/css";
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    },
    addListener: function() {
        // Listeners for collapse/expand all
        $('.expand-all-link').click(modmailPro.expandAll);
        $('.expand-all-link').click(modmailPro.collapseAll);

        // Add listener for the all/unread buttons to replace the default actions
        $('.all').on('click', function(e) {
            e.preventDefault();
            $('.message-parent').css('display','');
            $(this).parent().toggleClass('selected');
            $('.unread').parent().toggleClass('selected');
        });
        $('.unread').on('click', function(e) {
            e.preventDefault();
            $('.message-parent').css('display','none').has('.entry.new').css('display','');
            $(this).parent().toggleClass('selected');
            $('all').parent().toggleClass('selected');
        });
        
        // Listen for pages added in with NER
        $('div.content').on('DOMNodeInserted', function(e){
            if (e.target.parentNode.id && e.target.parentNode.id === 'siteTable' && e.target.className.match(/sitetable/)){
                var e = e.target.parentNode.querySelectorAll('.sitetable[id*="siteTable-"]:last-child > .message-parent');
                if (modmailPro.mmpCollapsed){
                    modmailPro.collapseAll(null, e);
                } else if (modmailPro.mmpFiltered){
                    modmailPro.setViewState(e, 'none');
                }  else if ($('.menuarea li').eq(1).is('.selected')){
                    $(e).hide();
                }
                modmailPro.addCollapseButtons(null, e);
            }
        });
    },
    filter: function() {
        var $link = $('.filter-link');

        // make look selected.
        $link.addClass('selected');

        // Hide threads
        modmailPro.setViewState('none');
        
        modmailPro.mmpFiltered = true;

        // Rebind filter button
        $link.unbind('click').click(modmailPro.unfilter);
        $link.text('unfilter')
    },
    unfilter: function() {
        var $link = $('.filter-link');

        // make look unselected.
        $link.addClass('selected');

        // Show threads.
        $('.message-parent').css('display','');
        
        modmailPro.mmpFiltered = false;

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
                $(this).css('display', state);
            }
        });
    },
    highlightUnread: function() {
        var ALL = 0,
            UNREAD = 1,
            now = new Date().getTime(),
            last = JSON.parse(localStorage['modmail_last_visited']) || {},
            count = 0;

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
        $('.menuarea').append('<span><b>' + count + '</b> - new message' + (count == 1 ? '' : 's'));

        // Hide read messages
        modmailPro.hideOld();

        // Update last read times
        $('.correspondent.reddit').text(function (_, sr, c) {
            last[sr.slice(3)] = now;
        });
        localStorage['modmail_last_visited'] = JSON.stringify(last);
    },
    hideOld: function(bool) {
        $('.message-parent').hide().has('.entry.new').show();
    },
    collapseThreads: function() {
        // add collapse button
        $('<span style="color:gray">  |  </span><a href="javascript:;" class="collapse-all-link">collapse all</a>').appendTo('.spacer').click(modmailPro.collapseAll);

        $("a.collapse-all-link").hover(function () {
            $(this).css('text-decoration', 'underline');
        }, function () {
            $(this).css('text-decoration', 'none');
        });

        modmailPro.addCollapseButtons();

        $('.collapse-link').on('click', function () {
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
    addCollapseButtons: function(source, target){
        $links = target ? $(target) : $('.message-parent');
        
        $links.each(function () {
            $(this).find('.correspondent a').parent().prepend('<a href="javascript:;" class="collapse-link">[-]</a> ');
            var count = $(this).find('.entry').length - 1;

            if (count > 0) {
                $('<span>[' + count + '] </span>').insertAfter($(this).find('.correspondent:first'));
            }
        });
    },
    collapseAll: function(source, target) {
        var $link = $('.collapse-all-link'),
            $links = target ? $(target) : $('.message-parent');
        // make look selected.
        $link.toggleClass('selected');
        
        // Hide threads.
        $links.each(function () {
            $(this).find('.entry, .expand-btn').css('display', 'none');
        });
        
        // Add class to body
        modmailPro.mmpCollapsed = true;

        $('.expand-all-link').addClass('collapse-all-link').removeClass('expand-all-link');
        $link.text('expand all');
        $('.collapse-link').text('[+]');
    },
    expandAll: function(source, target) {
        var $link = $('.collapse-all-link'),
            $links = target ? $(target) : $('.message-parent');

        // make look unselected.
        $link.toggleClass('selected');

        // Show threads.
        $links.each(function () {
            $(this).find('.entry, .expand-btn').css('display','');
        });
        
        modmailPro.mmpCollapsed = false;
        
        $('.collapse-all-link').addClass('expand-all-link').removeClass('collapse-all-link');
        $('.collapse-link').text('[-]');
    }
}
modmailPro.go();
}

if ( location.pathname.match(/\/message\/moderator\/$/) ) {
    var scr = document.createElement('script');
    scr.type = "text/javascript";
    scr.textContent = '(' + main.toString() + ')();';
    document.body.appendChild(scr);
}
