
Formatter = function (){}

(function () {
    /*

    {identifier.attribute[element]!conversion:format}

    "{" "identifier" "." "attribute" "[" "element" "]" "!" "conversion" ":" "format" "}"

    */

    var int_re = /^\d+$/;

    var InvalidFormatString = function (message) {
        this.message = message;
        this.name = 'InvalidFormatString';
    }
    InvalidFormatString.prototype.toString = function () {
        return this.name + ': "' + this.message + '"';
    }

    var MissingArgument = function (message) {
        this.message = message;
        this.name = 'MissingArgument';
    }
    MissingArgument.prototype.toString = function () {
        return this.name + ': "' + this.message + '"';
    }


    var Field = function() {
        this.name = undefined;
        this.attributes = [];
        this.conversion = undefined;
        this.format = '';
    }

    Field.prototype = {
        getValue: function(args, kwargs) {
            var numeric = parseInt(this.name), base, i;
            if (int_re.test(this.name)) {
                base = args[parseInt(this.name, 10)];
            }
            else {
                base = kwargs[this.name];
            }
            if (base === undefined) {
                throw new MissingArgument("no argument " + this.name);
            }
            for (i=0; i<this.attributes.length; i++) {
                if (base[this.attributes[i]] === undefined) {
                    throw new MissingArgument("no argument "
                                            + this.attributes[i]);
                }
                else { base = base[this.attributes[i]]; }
            }
            return base;
        }
    };

    var Format = function(text){
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

    Format.prototype = {
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

        setState: function(state) {
            this.state = Format.states[state];
        },

        format: function() {
            return self.vformat(arguments);
        },

        vformat: function(args, kwargs) {
            var out = [], i;
            if (kwargs === undefined) { kwargs = {}; }
            for (i=0; i < this.parts.length; i++) {
                console.log("looking at part: " + this.parts[i]);
                console.log(typeof(this.parts[i]));
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

    Format.states = {
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




    Formatter = function(){};
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