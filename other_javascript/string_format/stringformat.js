/*
 * stringformat.js
 * ===============
 * http://bitbucket.org/n3dst4/spikes/
 *
 * Formatting and variable substitutions, modelled after Python 3.0's Formatter.
 *
 * Usage
 * -----
 * f = new Format(template)
 * f.format([arg, arg...])
 * f.vformat(args, kwargs)
 *
 * Example
 * -------
 *
 *
 * Notes
 * -----
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

// Expose Field class as Format.Field
// _Format -> Format, expose it as this.Format
// fix thousands separator (,)
// fix tests to be locale-sensitive


/*globals Format*/

(function () {
    var int_re, nested_re, spec_re, Field, _Format, generalNumeric;

    ////////////////////////////////////////////////////////////////////////////
    // Regexes
    int_re = /^\d+$/;        // find decimal integers
    nested_re = /^{(.+)}$/;  // detect nested field name

    // [[fill]align][sign][#][0][width][,][.precision][type]
    spec_re =
     /^(?:([^}])?([<>=^]))?([ +-])?(#)?(0)?(\d+)?(,)?(\.\d+)?([bcdeEfFgGnoxX%])?$/


    ////////////////////////////////////////////////////////////////////////////
    // Main classes, BABY.

    /*
     * A field specification in a format string
     */
    Field = function(name) {
        this.name = name;
        this.attributes = [];
        this.conversion = undefined;
        this.formatSpec = '';
    }
    Field.prototype = {
        /*
         * Given format args, get formatted, converted str for this field.
         */
        getResult: function(args, kwargs) {
            return this.format(this.convert(this.getValue(args, kwargs)));
            //return this.convert(this.getValue(args, kwargs));
        },

        /*
         * Given list and object of args, get value referenced by this field.
         */
        getValue: function(args, kwargs) {
            var numeric, base, i, result;
            numeric = parseInt(this.name)
            // numeric or name?
            if (this.name === undefined) {
                //console.log(args.implicit_index);
                args.implicit_index = args.implicit_index || 0;
                base = args[args.implicit_index];
                args.implicit_index += 1;
            }
            else if (int_re.test(this.name)) {
                base = args[parseInt(this.name, 10)];
            }
            else {
                base = kwargs[this.name];
            }
            if (base === undefined) {
                throw {name: "Missing Argument",
                    message: "no such argument: " + this.name};
            }
            // drill down through attribute names
            for (i=0; i<this.attributes.length; i++) {
                result = nested_re.exec(this.attributes[i]);
                if (result !== null) {
                    // nested attribute ref, like {foo.{bar}}
                    this.attributes[i] = new Field(result[1])
                        .getValue(args, kwargs);
                }
                if (base[this.attributes[i]] === undefined) {
                    throw {name: "Missing Argument",
                        message: "no such argument: " + this.attributes[i]};
                }
                else { base = base[this.attributes[i]]; }
            }
            return base;
        },


        /*
         * Apply a conversion to a value
         */
        convert: function(value) {
            if (this.conversion === undefined) {
                return value;
            } else {
                try {
                    return Field.conversions[this.conversion](value);
                }
                catch (e) {
                    if (e.name == "TypeError") {
                        throw {name: "Unknown Conversion",
                            message: "cannot convert: " + this.conversion};
                    }
                    else {
                        throw e;
                    }
                }
            }
        },


        /*
         * Format given value according to
         */
        format: function(value) {
            var res, fill, align, sign, hash, zero, width, comma, precision,
                type, fillwidth, fillpatt, i;
            if (this.formatSpec === undefined || this.formatSpec == "") {
                return value;
            }
            res = spec_re.exec(this.formatSpec);
            //if (res === null)
            fill = res[1];
            align = res[2];
            sign = res[3] || "-";
            hash = res[4];
            zero = res[5];
            width = res[6];
            comma = res[7];
            precision = res[8];
            type = res[9];
            if (zero) {
                fill = fill || "0";
                align = align || "=";
            } else {
                fill = fill || " ";
                align = align || "<";
            }
            if (type && typeof(value) != "number") {
                value = parseFloat(value);
            }
            else if ((!type) && typeof(value) == "number") {
                if (comma) {
                    type = "n";
                }
                else if (value % 1 === 0) {
                    type= "d";
                }
                else {
                    type = "g";
                }
            }
            if (precision) {
                precision = parseInt(precision.substr(1));
            }
            if (typeof(value) == "number") {
                //alert("numeric");
                sign = (value < 0) ? "-" :
                        (sign == "+")? "+" :
                        (sign == " ")? " ":
                         "";
                value = Math.abs(value);
                value = Field.types[type](value, hash, precision, this);
            }
            else {
                value = value.toString();
                if (precision) {
                    value = value.substr(0, precision);
                }
            }
            if (width && value.length < width) {
                //console.log(fill);
                fillwidth = (width - value.length) - sign.length;
                for (fillpatt=""; fillpatt.length < fillwidth; ) {
                    fillpatt += fill;
                }
                if (align == "<") {
                    value = sign + value + fillpatt;
                }
                else if (align == ">") {
                    value =  fillpatt + sign + value;
                }
                else if (align == "=") {
                    value =  sign + fillpatt +  value;
                }
                else if (align == "^") {
                    value =  fillpatt.substr(0, Math.floor(fillwidth/2))
                            + sign + value +
                            fillpatt.substr(Math.floor(fillwidth/2));
                }
            }
            return value;
        }
    };
    Field.conversions = {
        s: function(value) { return value.toString(); },
        r: function(value) { return value.toString(); },
        a: function(value) { return value.toString(); }
    };
    Field.types = {
        b: function(value, hash, precision, field) {
            return (hash?"0b":"") + value.toString(2);
        },
        c: function(value, hash, precision, field) {
            return String.fromCharCode(value);
        },
        d: function(value, hash, precision, field) {
            return value.toString(10);
        },
        o: function(value, hash, precision, field) {
            return (hash?"0o":"") + value.toString(8);
        },
        x: function(value, hash, precision, field) {
            return (hash?"0x":"") + value.toString(16);
        },
        X: function(value, hash, precision, field) {
            return (hash?"0x":"") + value.toString(16).toUpperCase();
        },
        n: function(value, hash, precision, field) {
            return value.toLocaleString();
        },
        e: function(value, hash, precision, field) {
            return value.toExponential();
        },
        E: function(value, hash, precision, field) {
            return value.toExponential().toUpperCase();
        },
        f: function(value, hash, precision, field) {
            return value.toFixed(precision);
        },
        F: function(value, hash, precision, field) {
            return value.toFixed(precision).toUpperCase();
        },
        g: function(value, hash, precision, field) {
            return parseFloat(value.toPrecision(precision)).toString();
        },
        G: function(value, hash, precision, field) {
            return value.toPrecision(precision).toUpperCase();
        },
        '%': function(value, hash, precision, field) {
            return (value * 100).toFixed(precision) + "%";
        }
    };


    /*
     * A Format string, which can be used to produce formatted output.
     */
    _Format = function(text){
        var tokens, i;
        this.parts = [];
        this.field = new Field();
        this.setState("in_plain_text");
        this.text = text;
        tokens = this.tokenize(text);
        for (i=0; i < tokens.length; i++) {
            //console.log("token: " + tokens[i])
            this.state.apply(this, tokens[i]);
        }
    }
    _Format.prototype = {
        /*
         * Tokenize input using simple tokens.
         *
         * Return value is an array of tokens. For each token:
         * token[0] is the actual text of the token.
         * token[1] is a boolean indicating whether this is a "real" token
         *      (true) or just intervening plain text (false).
         */
        tokenize: function(text) {
            var chars, tokens, temp, i, j;
            chars = ['{', '}', '.', '[', ']', '!', ':'];
            tokens = [];
            temp = [];
            textloop: for (i = 0; i < text.length; i++) {
                for (j=0; j < chars.length; j++) {
                    if (text.charAt(i) == chars[j]) {
                        if (temp.length) {
                            tokens.push([temp.join(''), false]);
                        }
                        tokens.push([chars[j], true]);
                        temp = [];
                        continue textloop;
                    }
                }
                temp.push(text.charAt(i));
            }
            if (temp.length) {
                tokens.push([temp.join(''), false]);
            }
            return tokens;
        },

        /*
         * Set the state of the parser to named value.
         *
         * In default implementation, this should be the name of a state
         * function in _Format.states.
         */
        setState: function(state) {
            this.state = _Format.states[state];
        },

        /*
         * Produce formatted string absed on given values.
         *
         * This is a wrapper round vformat(). This method accepts any arguments
         * and passes them as an array as the first argument to vformat.
         * It is not possible to use named arguments with this method.
         */
        format: function() {
            return this.vformat(arguments);
        },

        /*
         * Produce formatted string based on given values.
         *
         * Arguments:
         * args: an array of values to be used in string.
         * kwargs: an object containing named values to be used in string.
         *
         * Return:
         * The formatted output using these values.
         */
        vformat: function(args, kwargs) {
            var out = [], i;
            if (kwargs === undefined) { kwargs = {}; }
            for (i=0; i < this.parts.length; i++) {
                //console.log("part : " + this.parts[i])
                if (typeof(this.parts[i]) == "string") {
                    out.push(this.parts[i]);
                }
                else {
                    out.push(this.parts[i].getResult(args, kwargs));
                }
            }
            return out.join('');
        }
    };


    /*
     * This is all of the default formatter's parsing states.
     */
    _Format.states = {
        in_plain_text: function (text, tokn) {
            if (text == "{") { this.setState("start_field"); }
            else { this.parts.push(text); }
        },

        start_field: function (text, tokn) {
            if (text == "{") {
                this.parts.push(text);
                this.setState("in_plain_text");
            }
            else if (text == ":") {
                this.setState("want_format");
            }
            else if (text == "!") {
                this.setState("want_conversion");
            }
            else if (text == "}") {
                this.parts.push(this.field);
                this.field = new Field();
                this.setState("in_plain_text");
            }
            else if (tokn) {
                throw {name: "Invalid format string",
                    message: "found unexpected " + text};
            }
            else {
                this.field.name = text;
                this.setState("after_field_name");
            }
        },

        after_field_name: function (text, tokn) {
            if (text == '.') {
                this.setState("want_attribute");
            }
            else if (text == "[") {
                this.setState("want_key");
            }
            else if (text == ":") {
                this.setState("want_format");
            }
            else if (text == "!") {
                this.setState("want_conversion");
            }
            else if (text == "}") {
                this.parts.push(this.field);
                this.field = new Field();
                this.setState("in_plain_text");
            }
            else {
                throw {name: "Invalid format string",
                    message: "can't cope with a " + text + " here"};
            }
        },

        want_attribute: function(text, tokn) {
            if (text == '{') {
                this.setState("want_nested_name");
            }
            else if (tokn) {
                throw {name: "Invalid format string",
                    message: "no attribute name specified"};
            }
            else {
                this.field.attributes.push(text);
                this.setState("after_field_name");
            }
        },

        want_nested_name: function(text, tokn) {
            if (tokn) {
                throw {name: "Invalid format string",
                    message: "no nested name specified"};
            }
            else {
                this.field.attributes.push("{" + text + "}");
                this.setState("want_end_nested_name");
            }
        },

        want_end_nested_name: function(text, tokn) {
            if (text != "}") {
                throw {name: "Invalid format string",
                    message: "nested attribute name must be one identifier"};
            }
            else {
                this.setState("after_field_name");
            }
        },

        want_key: function(text, tokn) {
            if (text == '{') {
                this.setState("want_nested_key");
            }
            else if (tokn) {
                throw {name: "Invalid format string",
                    message: "no key specified"};
            }
            else {
                this.field.attributes.push(text);
                this.setState("want_end_of_key");
            }
        },

        want_nested_key: function(text, tokn) {
            if (tokn) {
                throw {name: "Invalid format string",
                    message: "no nested key specified"};
            }
            else {
                this.field.attributes.push("{" + text + "}");
                this.setState("want_end_nested_key");
            }
        },

        want_end_nested_key: function(text, tokn) {
            if (text != '}') {
                throw {name: "Invalid format string",
                    message: "nested key name must be one identifier"};
            }
            else {
                this.setState("want_end_of_key");
            }
        },


        want_end_of_key: function(text, tokn) {
            if (text != ']') {
                throw {name: "Invalid format string",
                    message: "key name doesn't end in a ]"};
            }
            else {
                this.setState("after_field_name");
            }
        },

        want_conversion: function(text, tokn) {
            if (tokn) {
                throw {name: "Invalid format string",
                    message: " not followed by conversion type"};
            }
            else {
                this.field.conversion = text;
                this.setState("after_field_name");
            }
        },

        want_format: function(text, tokn) {
            if (text == '}') {
                this.parts.push(this.field);
                this.field = new Field();
                this.setState("in_plain_text");
            }
            else {
                this.field.formatSpec += text;
            }
        }
    };


    // Preserve global original
    _Format._Format = typeof(Format)=="undefined"?undefined:Format;
    Format = _Format;
    Format.noConflict = function () {
        if (_Format._Format !== undefined) {
            Format = Format._Format;
        }
    };
}());





// tests
/*
p = new Format('i am a {myname.myattr[mykey].{mynested}:myformat}');
console.log(p.parts);

p = new Format('i am a {foo:bar}');
console.log(p.parts);

p = new Format('i am a {foo!x:bar} with {0[1].2:3} {plort}');
console.log(p.parts);

p = new Format('i am a {foo.{0}!x:bar} with {0[1].2:3} {plort}');
console.log(p.parts);

p = new Format('i am a {0} with {1}');
console.log(p.format("zero", "one"));

p = new Format('i am a {0.name} with {0.color} and {1}');
console.log(p.format({name: 'pie', color:'brown'}, "peas"));

p = new Format('i am a {0.{1}}');
console.log(p.format({name: 'pie', color:'brown'}, "name"));

p = new Format('i am a {}');
console.log(p.format("red herring"));

p = new Format('i am a {:>10}');
console.log(p.format("blue herring"));
*/
//p = new Format('i am a !{0:020,.4e}!');
//console.log(p.format(-12345));




























