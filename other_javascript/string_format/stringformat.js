
/*globals Format*/

(function () {
    var int_re, nested_re, spec_re,
        InvalidFormatString, MissingArgument,
        Field, _Format;

    ////////////////////////////////////////////////////////////////////////////
    // Regexes
    int_re = /^\d+$/;        // find decimal integers
    nested_re = /^{(.+)}$/;  // detect nested field name

    // [[fill]align][sign][#][0][width][,][.precision][type]
    spec_re = /^(?:([^}])?[<>=^])?([ +-])?(#)?(0)?(\d+)?(,)?(\.\d+)?([bcdeEfFgGnoxX%])?$/


    ////////////////////////////////////////////////////////////////////////////
    // Exceptions

    /*
     * Exception caused by invalid format string
     */
    InvalidFormatString = function (message) {
        this.message = message;
        this.name = 'InvalidFormatString';
    }
    InvalidFormatString.prototype.toString = function () {
        return this.name + ': "' + this.message + '"';
    }

    /*
     * Exception caused by referencing an argument which doesn't exist
     */
    MissingArgument = function (message) {
        this.message = message;
        this.name = 'MissingArgument';
    }
    MissingArgument.prototype.toString = function () {
        return this.name + ': "' + this.message + '"';
    }


    ////////////////////////////////////////////////////////////////////////////
    // Main classes, BABY.

    /*
     * A field specification in a format string
     */
    Field = function(name) {
        this.name = name;
        this.attributes = [];
        this.conversion = undefined;
        this.format = '';
    }

    Field.prototype = {
        /*
         * Given list and object of args, get value referenced by this field.
         */
        getValue: function(args, kwargs) {
            var numeric = parseInt(this.name), base, i, result;
            // numeric or name?
            if (int_re.test(this.name)) {
                base = args[parseInt(this.name, 10)];
            }
            else {
                base = kwargs[this.name];
            }
            if (base === undefined) {
                throw new MissingArgument("no argument " + this.name);
            }
            // drill down through attribute names
            for (i=0; i<this.attributes.length; i++) {
                result = nested_re.exec(this.attributes[i]);
                if (result !== null) {
                    // nested attribute ref, like {foo.{bar}}
                    this.attributes[i] = new Field(result[1]).getValue(args, kwargs);
                }
                if (base[this.attributes[i]] === undefined) {
                    throw new MissingArgument("no argument "
                                            + this.attributes[i]);
                }
                else { base = base[this.attributes[i]]; }
            }
            return base;
        },

        formatToSpec: function(value) {

        }
    };


    /*
     * A compiled format string, ready to be run against arguments
     */
    _Format = function(text){
        var tokens, i;
        this.parts = [];
        this.field = new Field();
        this.setState("in_plain_text");
        this.text = text;
        tokens = this.tokenize(text);
        for (i=0; i < tokens.length; i++) {
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
            textloop: for (i=0; i<this.text.length; i++) {
                for (j=0; j<chars.length; j++) {
                    if (this.text.charAt(i) == chars[j]) {
                        if (temp.length) {
                            tokens.push([temp.join(''), false]);
                        }
                        tokens.push([chars[j], true]);
                        temp = [];
                        continue textloop;
                    }
                }
                temp.push(this.text.charAt(i));
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
         * Produce formatted string absed on given values.
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
                //console.log("looking at part: " + this.parts[i]);
                //console.log(typeof(this.parts[i]));
                if (typeof(this.parts[i]) == "string") {
                    out.push(this.parts[i]);
                }
                else {
                    out.push(this.parts[i].getValue(args, kwargs));
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
            if (text == '{') { this.setState("want_field_name"); }
            else { this.parts.push(text); }
        },

        want_field_name: function (text, tokn) {
            if (text == '{') {
                this.parts.push(text);
                this.setState("in_plain_text");
            }
            else if (tokn) {
                throw new InvalidFormatString('no name specified');
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
            else if (text == '[') {
                this.setState("want_key");
            }
            else if (text == ':') {
                this.setState("want_format");
            }
            else if (text == '!') {
                this.setState("want_conversion");
            }
            else if (text == '}') {
                this.parts.push(this.field);
                this.field = new Field();
                this.setState("in_plain_text");
            }
            else {
                throw new InvalidFormatString("can't cope with a " + text + " here");
            }
        },

        want_attribute: function(text, tokn) {
            if (text == '{') {
                this.setState("want_nested_name");
            }
            else if (tokn) {
                throw new InvalidFormatString('no attribute name specified');
            }
            else {
                this.field.attributes.push(text);
                this.setState("after_field_name");
            }
        },

        want_nested_name: function(text, tokn) {
            if (tokn) {
                throw new InvalidFormatString('no nested name specified');
            }
            else {
                this.field.attributes.push('{' + text + '}');
                this.setState("want_end_nested_name");
            }
        },

        want_end_nested_name: function(text, tokn) {
            if (text != '}') {
                throw new InvalidFormatString('nested attribute name must be one identifier');
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
                throw new InvalidFormatString('no key specified');
            }
            else {
                this.field.attributes.push(text);
                this.setState("want_end_of_key");
            }
        },

        want_nested_key: function(text, tokn) {
            if (tokn) {
                throw new InvalidFormatString('no nested key specified');
            }
            else {
                this.field.attributes.push('{' + text + '}');
                this.setState("want_end_nested_key");
            }
        },

        want_end_nested_key: function(text, tokn) {
            if (text != '}') {
                throw new InvalidFormatString('nested key name must be one identifier');
            }
            else {
                this.setState("want_end_of_key");
            }
        },


        want_end_of_key: function(text, tokn) {
            if (text != ']') {
                throw new InvalidFormatString("key name doesn't end in a ]");
            }
            else {
                this.setState("after_field_name");
            }
        },

        want_conversion: function(text, tokn) {
            if (tokn) {
                throw new InvalidFormatString('! not followed by conversion type');
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
                this.field.format += text;
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





    // tests
    p = new _Format('i am a {myname.myattr[mykey].{mynested}:myformat}');
    console.log(p.parts);

    p = new _Format('i am a {foo:bar}');
    console.log(p.parts);

    p = new _Format('i am a {foo!x:bar} with {0[1].2:3} {plort}');
    console.log(p.parts);

    p = new _Format('i am a {foo.{0}!x:bar} with {0[1].2:3} {plort}');
    console.log(p.parts);

    p = new _Format('i am a {0} with {1}');
    console.log(p.format("zero", "one"));

    p = new _Format('i am a {0.name} with {0.color} and {1}');
    console.log(p.format({name: 'pie', color:'brown'}, "peas"));

    p = new _Format('i am a {0.{1}}');
    console.log(p.format({name: 'pie', color:'brown'}, "name"));


}());





























