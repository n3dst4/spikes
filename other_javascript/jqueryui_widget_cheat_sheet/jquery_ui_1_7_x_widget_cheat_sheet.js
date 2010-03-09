/*
 * jquery_ui_1_7_x_widget_cheat_sheet.js
 * =====================================
 * 
 * A cheat sheet for defining and using widgets in jQuery UI 1.7.x. There have
 * been a few changes in jQuery UI 1.8.x but the principles remain the same.
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

////////////////////////////////////////////////////////////////////////////////
// DEFINING A WIDGET

// Step 1. Create the prototype for the widget
//      This object defines all the methods for our widget
FooWidget = {
    // initializer
    _init: function() {
        this.element; // is jQuery object
        this.options;
    },

    // a public method
    bar: function(args) {
        this._bang()
    },

    // a private method (= named with leading underscore)
    _bang: function() {
        
    },

    // public getter method (and see other setup)
    getWibble: function() {
        return "wibble";
    }
}


// Step 2. Call jQuery UI widget factory
//      This creates the actual callable widget as $(whatever).fooWidget()
$.widget("ui.fooWidget", FooWidget);

 
// Step 3. Define getters
//      These methods will return their actual return value, not jQuery object.
$.ui.FooWidget.getter = "getWibble"; // comma separated

// Step 4. Define default options
$.ui.FooWidget.defaults = {
    a: "A",
    b: "B",
    getData: function() { // a callback
        // load dummy data
    }
}



////////////////////////////////////////////////////////////////////////////////
// USING THE WIDGET

// 1. Get object you want to use as widget
var foo = $("#foo");

 
// 2. Create widget instance
//      Options passed here override the defaults
foo.fooWidget({
    a: "AAA",
    getData: function() {
        // load real data
    }
});

 
// 3. Call widget methods
//      Methods are named in a string parameter - see below for a way to access
//      them directly.
foo.FooWidget("bar", args);
foo.FooWidget("_bang"); // error - is private
var wibble = foo.FooWidget("getWibble");



////////////////////////////////////////////////////////////////////////////////
// OTHER TIPS

// Calling a widget method the way shown above will return the jQuery object, so
// it's chainable:
foo.FooWidget("bar", 1)
        .fadeIn()
        .FooWidget("bar", 2);
        
// You can combine steps 1 and 2 of defining a widget by just providing the
// prototype directly to the factory (no need for a temporary variable):
$.widget("ui.barWidget", {
    _init: function() { /* ... */ },
    doBar: function() { /* ... */ }
});

// If you need to call a lot of methods on a widget, the syntax above may get
// clunky. You can get hold of the widget object directly by calling
// .data(widgetName) on the element:
myWidget = $("#foo").data("fooWidget");
myWidget.bar();
myWidget.getWibble();























