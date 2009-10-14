/*
 * jquery.limited_textarea.js
 * ==========================
 * http://bitbucket.org/n3dst4/spikes/
 *
 * JQuery plugin for giving a textarea a Twitter-esque soft character limit.
 *
 * Usage
 * -----
 * limited_textarea(limit, [options])
 *
 * Example
 * -------
 * // 200 character limit:
 * $("#mytextarea").limited_textarea(200)
 *
 * // 300 character limit, warns at 50:
 * $("#mytextarea").limited_textarea(200, {threshold: 50})
 *
 * Options
 * -------
 * threshold: (default: 10) Number of characters remaining at which to apply
 *     counter_class_low,
 * counter_class: class name to apply to the counter div
 *      ("limited_textarea_count"),
 * counter_class_low: class to apply to counter when threshold reached
 *      ("limited_textarea_low"),
 * counter_class_zero: class to apply to counter when remaining characters
 *      reaches zero ("limited_textarea_zero")
 * counter_class_negative: class to apply to counter when remaining characters
 *      goes negative ("limited_textarea_negative")
 * disable_parent_form_on_overflow: Boolean - if true, when the characters
 *      remaining goes negative, the form is prevented from being submitted
 *      (true)
 * on_overflow: Function or array of functions to be called when the characters
 *      remaining count goes negative ([])
 * on_underflow: Function or array of functions to be called when the characters
 *      remnaining count ceases to be negative ([])
 *
 * Notes
 * -----
 * The remaining character count is shown in a div below the textarea itself.
 *
 * You can style the counter by creating CSS classes called:
 * limited_textarea_count     // always applied to counter
 * limited_textarea_low       // applied when chars remaining < threshold
 * limited_textarea_zero      // applied when chars remaining == 0
 * limited_textarea_negative  // applied when chars remaining < 0
 *
 * If you want additional actions to happen when the textarea is overfilled,
 * (such as making the texarea go yellow or triggering your own validation
 * system,) create an on_overflow callback. Create an on_underflow callback if
 * you need to do something when the textarea comes back within limits. Callback
 * functions are called without arguments.
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
 * THIS SOFTWARE IS PROVIDED BY <copyright holder> ''AS IS'' AND ANY
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

(function ($) {
    var normal, low, zero, negative, disable;
    normal = 2;
    low = 1;
    zero = 0;
    negative = -1;
    disable = function () { return false; };

    $.fn.limited_textarea = function(limit, options) {
        this.each(function () {
            var i, opts, callbacks, count_box, el, last, update;
            opts = $.extend({}, $.fn.limited_textarea.defaults, options);
            callbacks = ["on_overflow", "on_underflow"];
            for (i in callbacks) { // set up callbacks
                if (opts[callbacks[i]] instanceof Function) {
                    opts[callbacks[i]] = [opts[callbacks[i]]];
                }
            }
            if (opts.disable_parent_form_on_overflow) {
                // add built-in callbacks
                opts.on_overflow.push(function() {
                    el.parents("form").bind("submit", disable);
                    el.parents("form").find("input:submit").attr("disabled", "disabled");
                });
                opts.on_underflow.push(function() {
                    el.parents("form").unbind("submit", disable);
                    el.parents("form").find("input:submit").attr("disabled", "");
                });
            }

            el = $(this);
            count_box = $("<div class='"+opts.counter_class+"'></div>");
            el.after(count_box);
            last = normal; // track state

            update = function() { // called on keyup
                var len, remaining, state, i;
                len = el.val().length;
                remaining = limit - len;
                count_box.text(remaining + "/" + limit);
                if (remaining > opts.threshold) { state = normal; }
                else if (remaining > 0)         { state = low; }
                else if (remaining === 0)       { state = zero; }
                else                            { state = negative; }

                if (state !== last) {
                    // set classes
                    if (state === normal) {
                        count_box.removeClass(opts.counter_class_low)
                                 .removeClass(opts.counter_class_zero)
                                 .removeClass(opts.counter_class_negative);
                    }
                    else if (state === low) {
                        count_box.addClass(opts.counter_class_low)
                                 .removeClass(opts.counter_class_zero)
                                 .removeClass(opts.counter_class_negative);
                    }
                    else if (state === zero) {
                        count_box.removeClass(opts.counter_class_low)
                                 .addClass(opts.counter_class_zero)
                                 .removeClass(opts.counter_class_negative);
                    }
                    else if (state === negative) {
                        count_box.removeClass(opts.counter_class_low)
                                 .removeClass(opts.counter_class_zero)
                                 .addClass(opts.counter_class_negative);
                    }

                    // run callbacks
                    if (state === negative) {
                        for (i = 0; i < opts.on_overflow.length; i++) {
                            opts.on_overflow[i]();
                        }
                    }
                    else if (last === negative) {
                        for (i = 0; i < opts.on_underflow.length; i++) {
                            opts.on_underflow[i]();
                        }
                    }
                }
                last = state;
            };

            update();
            el.keyup(update);
        });
        return this;
    };

    $.fn.limited_textarea.defaults = {
        threshold: 10,
        counter_class: "limited_textarea_count",
        counter_class_low: "limited_textarea_low",
        counter_class_zero: "limited_textarea_zero",
        counter_class_negative: "limited_textarea_negative",
        disable_parent_form_on_overflow: true,
        on_overflow: [],
        on_underflow: []
    };
})(jQuery);
































