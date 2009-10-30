/*
 * jquery.selectable.js
 * ==========================
 * http://bitbucket.org/n3dst4/spikes/
 *
 * JQuery plugin for enabling and disabling text selection.
 *
 *
 * Usage
 * -----
 * $(selector).selectable(boolean)  // make elements (un)selectable
 * $(selector).selectable()         // return current selectability status
 *
 *
 * Example
 * -------
 *     // make <p class="infobox"> unselectable
 *     $("p.infobox").selectable(false)
 *
 *
 * Options
 * -------
 * boolean: true to turn selectability on, false to turn it off. Give no
 *      arguments (or undefined) to return current selectability (as determined
 *      by this plugin; if you've made text unselectable by some other means,
 *      this plugin won't know about it.)
 *
 *
 * Notes
 * -----
 * Because there's no standard for this yet, everyone seems to be doing it a
 * different way. This plugin tries to be as flexible and general-purpose as
 * possible.
 *
 * PLEASE note that turning off selectability to stop people copying your text
 * is pretty much a fool's errand. If there's text on someone's screen, they
 * can copy it, and silly Javascript tricks just annoy your users. This plugin
 * is intended for interface elements where you want to disable text selection
 * for usability reasons, such as toolbars and accordions.
 *
 * Internet Explorer and Opera: in these browsers it's possible to select
 * "unselectable" text by starting your selection outside of the "unselectable"
 * region. There is no way to prevent this.
 *
 * Tested in:
 *  * Firefox 3.5.4
 *  * Internet Explorer 6.0
 *  * Internet Explorer 8.0 (in IE8 and IE7 modes)
 *  * Google Chrome 3.0.195.27
 *  * Safari 4.0.3 (on Windows)
 *  * Opera 10.01
 *
 *
 * Copyright and licence
 * ---------------------
 * Copyright (c) 2009, Neil de Carteret
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the <organization> nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY NEIL DE CARTERET ''AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL <copyright holder> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*global jQuery */
/*jslint onevar: true, browser: true, undef: true, regexp: true, newcap: true */

(function($){
    var falsey, strategy, css_on, css_off, attrs;
    falsey = function () { return false; };

    // generic func for switching selectability on by CSS
    css_on = function(elements, attr) {
        elements.each(function(){
            var e = $(this);
            e.css(attr, e.data('original_user_select') || 'all');
        });
    };

    // generic func for switching selectability off by CSS
    css_off = function(elements, attr) {
        elements.each(function(){
            var e = $(this);
            e.data('original_user_select', e.css(attr));
        });
        elements.css(attr, 'none');
    };

    attrs = ['UserSelect', 'MozUserSelect',
             'WebkitUserSelect', 'KhtmlUserSelect'];

    // actual plugin function
    $.fn.selectable = function(change) {
        var i, el;
        el = this.get(0);

        // no argument - return status (defaults to true)
        if (change === undefined) {
            return this.data("selectable")===undefined?
                true:
                this.data("selectable");
        }

        // determine and cache strategy, part 1: look for CSS attribute to use
        if (!strategy) {
            for (i=0; i < attrs.length && !strategy; i++) {
                if (el.style[attrs[i]] !== undefined) {
                    (function () {
                        var attr = attrs[i];
                        strategy = {
                            on: function(el) { css_on(el, attr); },
                            off: function(el) { css_off(el, attr); }
                        };
                    }());
                    break;
                }
            }
        }

        // determine and cache strategy, part 2: try HTML attribute or event
        if (!strategy) {
            if (el.unselectable !== undefined) {
                strategy = {
                    on: function(el) { el.attr('unselectable', 'off'); },
                    off: function(el) { el.attr('unselectable', 'on'); }
                };
            }
            else if (el.onselectstart !== undefined) {
                strategy = {
                    on: function(el) { el.unbind('selectstart', falsey); },
                    off: function(el) { el.bind('selectstart', falsey); }
                };
            }
            else {
                strategy = {on: falsey, off: falsey}; // no idea - do nothing
            }
        }

        // apply strategy
        if (change === true)       { strategy.on(this); }
        else if (change === false) { strategy.off(this); }
        this.data('selectable', change);
        return this;
    };
})(jQuery);
