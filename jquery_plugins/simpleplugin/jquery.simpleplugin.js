/*
 * jquery.simpleplugin.js
 * ==========================
 * http://bitbucket.org/n3dst4/spikes/
 *
 * JQuery plugin which saves code when creating simple types of plugin.
 *
 * Specifically, simplePlugin helps when you're creating the sort of plugin
 * where you want to perform the same jQuery based operation on every element
 * selected or on the whole lot together.
 *
 * Usage
 * -----
 * jQuery.simplePlugin(name, func, [defaults, [iterate]])
 *
 * Example
 * -------
 *     // Create a simpleplugin called colorize, which sets the css color and
 *     // background-color. It can be called as $(selector).colorize(options).
 *     $.simplePlugin("colorize", //
 *         function(opts){
 *             this.css('color', opts.color);
 *             this.css('background-color', opts.background);
 *         },
 *         {
 *             color: 'green',
 *             background: 'lightgoldenrodyellow'
 *         },
           false // you could leave this out
 *     );
 *
 * Options
 * -------
 * name: the name of the plugin. The plugin function itself will be exposed as
 *     jQuery.fn.<name>, so it can be called as $(selector).<name>.
 * func: a function which will be run for every element selected. Inside this
 *     function, "this" is a jQuery object containing either (a) all the
 *     selected elements, or (b) one of the selected elements, depending on the
 *     "iterate" argument (see below). The function should accept one argument,
 *     a dictionary (object) of named options. This dictionary is created by
 *     combining the defaults (see below) with the opts given in this
 *     invocation.
 * defaults: an object containing default options for this plugin. This object
 *     will be exposed as jQuery.fn.<name>.defaults. Client code can modify
 *     this object to change the default values for future invocations.
 * iterate: boolean indicating whether the function should be run once for the
       whole set of selected elements, or once for each element. Default: false.
 *
 * Notes
 * -----
 *
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



(function(){
    $.simplePlugin = function(name, func, defaults, iterate) {
        if (!name) throw "No name specified for simplePlugin";
        defaults = defaults || {};
        $.fn[name] = function(options) { // actual plugin function
            var opts;
            opts = $.extend({}, $.fn[name].defaults, options);
            if (iterate) {
                this.each(function(){
                    func.apply($(this), [opts]);
                });
            }
            else {
                func.apply(this, [opts]);
            }
            return this; // good puppy
        }
        $.fn[name].defaults = defaults;
    };
})(jQuery);
