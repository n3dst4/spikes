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
 * format spec: [[fill]align][sign][#][0][width][,][.precision][type]
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
 * DISCLAIMED. IN NO EVENT SHALL NEIL DE CARTERET BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// fix thousands separator (,) - general commify function
// "n" + "," throws error // really? how 'bout allowing commify as fallback?
// f defaults to 6 figures precision
// e is exponent, f is fixed, g is "normal" (.toString), n is .toLocaleString
// % is in fixed <- actually that's a bit crap,
//
// subfields anywhere
// finish docco
// jslint

/*globals Format*/


(function () {
    var int_re, nested_re, spec_re, Field, Format, generalNumeric, commify,
            Tokenizer;

    ////////////////////////////////////////////////////////////////////////////
    // Regexes
    int_re = /^\d+$/;        // find decimal integers
    nested_re = /^{(.+)}$/;  // detect nested field name
    spec_re =
     /^(?:([^}])?([<>=^]))?([ +-])?(#)?(0)?(\d+)?(,)?(\.\d+)?([bcdeEfFgGnoxX%])?$/
    commify_re = /^([^\.]*?)(\d+)(\.?)/;

    /*
     * turn a number into a string with "," signs between groups of thousands
     *
     * args:
     * num: the number to format. can also be a string containing one valid
     *          number somewhere within it.
     * thousand_sep: (optional) the character to use as the thousand-separator.
     * decimal_sep: (optional) the character to use instead of "." before the
     *          fractional part of the number
     *          Jonny Foreigner mike like
     */
    commify = function(num, thousand_sep, decimal_sep) {
        thousand_sep = thousand_sep || ",";
        decimal_sep = decimal_sep || ".";
        num = num.toString();
        return num.replace(commify_re, function (str, prefix, digits, decimal) {
            var i, result;
            groups = [];
            if (digits.length % 3 != 0) {
                groups.push(digits.substr(0, digits.length % 3));
                digits = digits.substr(digits.length % 3);
            }
            for (i = 0; i <digits.length; i += 3) {
                groups.push( digits.substr(i, 3) );
            }
            return prefix + groups.join(thousand_sep) +
                (decimal?decimal_sep:"");
        });
    };


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
         * Format given value according to format spec
         */
        format: function(value) {
            var res, fill, align, sign, hash, zero, width, comma, precision,
                type, fillwidth, fillpatt, i, spec;
            //if (this.formatSpec === undefined || this.formatSpec == "") {
            //    return value;
            //}
            // Get field values
            res = spec_re.exec(this.formatSpec);
            fill = res[1]; align = res[2]; sign = res[3] || ""; hash = res[4];
            zero = res[5]; width = res[6]; comma = res[7];  precision = res[8];
            type = res[9];
            // 0<width> is a convenience, equivalent to starting with "0="
            if (zero && !fill && !align) {
                fill = "0";
                align = "=";
            } else {
                fill = fill || " ";
                align = align || "<";
            }
            // types codes require numeric values, so parse them out here...?
            if (type && typeof(value) != "number") {
                value = parseFloat(value);
            }
            // otherwise, set a default type
            else if ((!type) && typeof(value) == "number") {
                if (comma) { type = "n"; }
                else if (value % 1 === 0) { type= "d"; }
                else { type = "g"; }
            }
            // remove leading dot from precision
            if (precision) { precision = parseInt(precision.substr(1)); }
            // calculate actual sign
            if (typeof(value) == "number") {
                sign = (value < 0) ? "-" :
                        (sign == "-")? "":sign;

                value = Math.abs(value);
                // apply type
                value = Field.types[type](value, hash, precision, comma);
            }
            else {
                value = value.toString();
                if (precision) {
                    value = value.substr(0, precision);
                }
            }
            // fill
            if (width && value.length < width) {
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
            else {
                value = sign + value;
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
        b: function(value, hash, precision, comma) {
            return (hash?"0b":"") + value.toString(2);
        },
        c: function(value, hash, precision, comma) {
            return String.fromCharCode(value);
        },
        d: function(value, hash, precision, comma) {
            var s = value.toString(10);
            return comma? commify(s) : s;
        },
        o: function(value, hash, precision, comma) {
            return (hash?"0o":"") + value.toString(8);
        },
        x: function(value, hash, precision, comma) {
            return (hash?"0x":"") + value.toString(16);
        },
        n: function(value, hash, precision, comma) {
            var s = value.toLocaleString();

            return s;
        },
        e: function(value, hash, precision, comma) {
            return value.toExponential();
        },
        f: function(value, hash, precision, comma) {
            return value.toFixed(precision);
        },
        g: function(value, hash, precision, comma) {
            var sig;
            if (precision) { sig = value.toPrecision(precision); }
            else { sig = value; }
            return parseFloat(sig).toString();
        },
        '%': function(value, hash, precision, comma) {
            return (value * 100).toFixed(precision) + "%";
        },

        // capitalised versions
        F: function() {
            return Field.types.f.apply(this, arguments).toUpperCase();
        },
        E: function() {
            return Field.types.e.apply(this, arguments).toUpperCase();
        },
        X: function(value, hash, precision, comma) {
            return (hash?"0x":"") + value.toString(16).toUpperCase();
        },
        G: function() {
            return Field.types.g.apply(this, arguments).toUpperCase();
        }
    };


    /*
     * A stream of tokens
     * @constructor
     */
    Tokenizer = function (text) {
        this.text = text;
        this.start = 0;
        this.end = 0;
        this.token = null;
    };
    Tokenizer.prototype = {
        get: function () {
            var text, i, re, score, match, bestMatch, bestScore, bestType, tok;
            if (this.token) {
                return this.token;
            }
            text = this.text.substr(this.end);
            bestMatch = "";
            bestScore = -1;
            bestType = null;
            for (i=0; i < arguments.length; i++) {
                re = Tokenizer.tokens[arguments[i]].pattern;
                score = Tokenizer.tokens[arguments[i]].score;
                match = re.exec(text);
                if (match !== null &&
                        (match[0].length > bestMatch.length ||
                        (match[0].length == bestMatch.length &&
                        score > bestScore)) {
                    bestMatch = match[0];
                    bestScore = score;
                    bestType = arguments[i];
                }
            }
            if (bestType) {
                tok = {
                    text: bestMatch,
                    type: bestType,
                    start: this.start,
                    end: this.start + bestMatch.length,
                    length: bestMatch.length,
                    toString: function() { return this.text; }
                };
                this.start = this.end;
                this.end = this.end + bestMatch.length;
                this.token = tok;
            }
            else {
                throw {name: "Parsing error",
                        message: "Unexpected character " + text.substr(0,1) +
                        " at position " + this.end + " in format string"}
            }
            return tok;
        },
        next: function () {
            this.token = null;
            this.start = this.end;
            return this.get.apply(this, arguments);
        },
        is: function () {
            var i, isIn;
            isIn = false;
            for(i = 0; i < arguments.length && isIn === false; i++) {
                isIn = this.token.type == arguments[i];
            }
            return isIn;
        },
        hasMore: function () {
            return this.end < this.text.length;
        }
    };
    Tokenizer.tokens = {
        OPENCURLY:      {score: 1,  pattern: /^{/ },
        CLOSECURLY:     {score: 2,  pattern: /^}/ },
        OPENSQUARE:     {score: 3,  pattern: /^\[/ },
        CLOSESQUARE:    {score: 4,  pattern: /^\]/ },
        DOT:            {score: 5,  pattern: /^\./ },
        BANG:           {score: 6,  pattern: /^!/ },
        COLON:          {score: 7,  pattern: /^:/ },
        LITERALCHARS:   {score: 8,  pattern: /^(?:[^{]|{{)+/ },
        IDCHARS:        {score: 9,  pattern: /^[^\[\]{}:!\.]+/ },
        CONVERSIONCHAR: {score: 10, pattern: /^[rsa]/ },
        FORMATCHARS:    {score: 11, pattern: /^[^{}]+/ }
    }


    /*
     * A Format string, which can be used to produce formatted output.
     */
    Format = function (text) {
        var tokens, i;
        this.parts = [];
        this.text = text;
        token = new Tokenizer(text);
        this.parts = Format.parser.formatString(token);
    };
    Format.Field = Field;
    Format.prototype = {
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


    Format.parser = {
        // entire template
        formatString: function(token) {
            var parts, tok;
            parts = [];
            while (token.hasMore()) {
                token.next("OPENCURLY", "LITERALCHARS");
                if (token.is("OPENCURLY")) {
                    parts.push(this.field(token));
                }
                else {
                    parts.push(token.get().text);
                }
            }
            return parts;
        },

        // top-level { } pair
        field: function(token) {
            var field_name_parts;
            var field = new Field();
            token.next("IDCHARS", "BANG", "COLON", "CLOSECURLY");

            while (!token.equals("}")) {
                if (token.equals("!")) {
                    token.next();
                    field.conversion = this.conversion(token);
                }
                else if (token.equals(":")) {
                    token.next();
                    field.formatSpec = this.formatSpec(token);
                }
                else {
                    field_name_parts = this.fieldName(token);
                    field.name = field_name_parts[0];
                    field.attributes = field_name_parts.slice(1);
                    token.next();
                }
            }
            return field;
        },

        // identifying part of a field
        fieldName: function(token) {
            var parts, brack;
            parts = [];
            parts.push(token.get()); // actual name or id
            token.next();
            while (token.isIn(".", "[")) {
                if (token.equals("[")) { brack = true; }
                token.next();
                if (token.equals("{")) {
                    token.next();
                    parts.push(this.simpleField(token));
                }
                else {
                    parts.push(token.get());
                    token.next();
                    if (brack && token.equals("]")) {
                        token.next();
                    }
                }
            }
            return parts;
        },
        simpleField: function(token) {
            var field, parts;
            field = new Field();
            if (token.equals("}")) {
                parts = fieldName(token);
                field.name = parts[0];
                field.attributes = parts.slice(1);
                token.next();
            }
            return field;
        },
        subkey: function(token) {
        },
        key: function(token) {
        },
        conversion: function(token) {
            return "conversion";
        },
        formatSpec: function(token) {
            return "format spec";
        }
    };


    /*
     * This is all of the default formatter's parsing states.
     */
    Format.states = {
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


    // seems handy
    Format.commify = commify;
    // Preserve global original
    Format._Format = this.Format;
    this.Format = Format;
    Format.noConflict = function () { this.Format = Format._Format; };
}());






























