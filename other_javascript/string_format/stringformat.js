
Formatter = function (){}

(function () {
    var extnd = jQuery?jQuery.extend:
                Underscore?Underscore.extend:
                undefined;
    if (!extend) throw ("stringformat.js needs jQuery or Underscore");

    /*

    {identifier.attribute[element]!conversion:format}

    "{" "identifier" "." "attribute" "[" "element" "]" "!" "conversion" ":" "format" "}"

    */

    var Field = function() {
        this.name = undefined;
        this.attributes = [];
        this.conversion = undefined;
        this.format = undefined;
    }

    var parts = [];
    var field = new Field();

    var in_plain_text = function (text, tokn) {
        if (text == '{') { state = want_field_name; }
        else { parts.push(text); }
    };

    var want_field_name = function (text, tokn) {
        if (text == '{') {
            parts.push(text);
            state = in_plain_text;
        }
        else if (tokn) {
            throw "invalid format string: no name specified";
        }
        else {
            field.name = text;
            state = after_field_name;
        }
    };

    var after_field_name = function (text, tokn) {
        if (text == '.') {
            state = want_attribute;
        }
        else if (text == '[') {
            state = want_key;
        }
        else if (text == ':') {
            state = want_format;
        }
        else if (text == '!') {
            state = want_conversion;
        }
        else if (text == '}') {
            parts.push(field);
            field = new Field();
            state = in_plain_text;
        }
        else {
            throw "invalid format string: can't cope with a " + text + " here";
        }
    }


    var want_attribute = function(text, tokn) {
        if (text == '{') {
            state = want_nested_name;
        }
        else if (tokn) {
            throw "invalid format string: no attribute name specified";
        }
        else {
            field.attributes.push(text);
            state = after_field_name;
        }
    }


    var want_nested_name = function(text, tokn) {
        if (tokn) {
            throw "invalid format string: no nested name specified";
        else {
            field.attributes.push('{' + text + '}';
            state = want_end_nested_name;
        }
    }

    var want_end_nested_name = function(text, tokn) {
        if (text != '}') {
            throw "invalid format string: nested attribute name must be one identifier";
        else {
            state = after_field_name;
        }
    }



    var want_key = function(text, tokn) {
        if (text == '{') {
            state = want_nested_key;
        }
        else if (tokn) {
            throw "invalid format string: no key specified";
        }
        else {
            field.attributes.push(text);
            state = want_end_of_key;
        }
    }

    var want_nested_key = function(text, tokn) {
        if (tokn) {
            throw "invalid format string: no nested key specified";
        else {
            field.attributes.push('{' + text + '}';
            state = want_end_nested_key;
        }
    }

    var want_end_nested_key = function(text, tokn) {
        if (text != '}') {
            throw "invalid format string: nested key name must be one identifier";
        else {
            state = want_end_of_key;
        }
    }


    var want_end_of_key = function(text, tokn) {
        if (text != ']') {
            throw "invalid_format_string: key name doesn't end in a ]";
        }
        else {
            state = after_field_name;
        }
    }


    var state = in_plain_text;

    var tokenizer = new Tokenizer([
            '{', '}', '.', '[', ']', '!', ':',
        ],function(text, tokn, re){
            state(text, tokn);
        }
    );

    var token_re = /\{(.+?)\}/;


    Formatter.prototype = {
        /*
         * Format a string according to a format string and some arguments.
         */
        format: function () {
            var i, args, named_args;
            if (arguments.length == 0) { throw "No args supplied to format()"; }
            for (i=1; i<arguments.length; i++) {

            }
        },

        vformat: function (format_string, args, named_args) {

        },

        /*
         *
         */
        parse: function (format_string) {

        },

        /*
         *
         */
        get_field: function (field_name, args, kwargs) {

        },

        /*
         *
         */
        get_value: function (key, args, kwargs) {

        },

        /*
         *
         */
        check_unused_args: function (used_args, args, kwargs) {

        },

        /*
         *
         */
        format_field: function (value, format_spec) {

        },

        /*
         *
         */
        convert_field: function (value, conversion) {

        }
    };
}());