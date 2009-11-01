/*
 * test_stringformat.js - tests for stringformat.js
 */

$(function(){
    // big array of tests. these get run through QUnit way down there *points*.
    tests = [
        "Basic string substitutions",
        [
            "One indexed",
            "test {0} test",
            ["foo"],
            {},
            "test foo test"
        ],
        [
            "Two indexed",
            "test {0} test {1} test",
            ["foo", "bar"],
            {},
            "test foo test bar test"
        ],
        [
            "No plain-text token at end",
            "test {0} test {1}",
            ["foo", "bar"],
            {},
            "test foo test bar"
        ],
        [
            "Indexed out of order",
            "test {1} test {0}",
            ["foo", "bar"],
            {},
            "test bar test foo"
        ],
        [
            "Named arg",
            "test {foo} test {bar} test",
            [],
            {foo: "pop", bar: "bang"},
            "test pop test bang test"
        ],
        [
            "named and indexed args",
            "test {0} test {foo} test",
            ["foo"],
            {foo: "pop"},
            "test foo test pop test"
        ],
        [
            "Implicit args",
            "test {} test {} test",
            ["foo", "bar"],
            {},
            "test foo test bar test"
        ],

        "Attribute selectors",
        [
            "Numeric attribute of arg",
            "test {0.0}",
            [["foo"]],
            {},
            "test foo"
        ],
        [
            "Named attribute of arg",
            "test {0.foo}",
            [{foo: "pop"}],
            {},
            "test pop"
        ],
        [
            "Numeric key of arg",
            "test {0[0]}",
            [["foo"]],
            {},
            "test foo"
        ],
        [
            "Named key of arg",
            "test {0[foo]}",
            [{foo: "pop"}],
            {},
            "test pop"
        ],

        "Nested attribute selectors",
        [
            "Attribute referenced by numeric arg which references number",
            "test {0.{1}}",
            [["foo"], 0],
            {},
            "test foo"
        ],
        [
            "Attribute referenced by numeric arg which references name",
            "test {0.{1}}",
            [{foo: "pop"}, "foo"],
            {},
            "test pop"
        ],
        [
            "Key referenced by numeric arg which references number",
            "test {0[{1}]}",
            [["foo"], 0],
            {},
            "test foo"
        ],
        [
            "Key referenced by numeric arg which references name",
            "test {0[{1}]}",
            [{foo: "pop"}, "foo"],
            {},
            "test pop"
        ],

        "Numeric substitutions",
        [
            "Basic numeric substitution",
            "test {0}",
            [1],
            {},
            "test 1"
        ],
        [
            "Floating point integer",
            "test {0}",
            [1.0],
            {},
            "test 1"
        ],
        [
            "Floating point with fraction",
            "test {0}",
            [1.5],
            {},
            "test 1.5"
        ],
        [
            "Negative floating point",
            "test {0}",
            [-1.5],
            {},
            "test -1.5"
        ],

        "Format specs",
        [
            "Basic number without format",
            "test {0}",
            [1000],
            {},
            "test 1000"
        ],
        [
            "Field width specified",
            "test {0:10}",
            [1000],
            {},
            "test 1000      "
        ],
        [
            "Custom fill character, left align",
            "test {0:*<10}",
            [1000],
            {},
            "test 1000******"
        ],
        [
            "Custom fill character, right align",
            "test {0:*>10}",
            [1000],
            {},
            "test ******1000"
        ],
        [
            "Custom fill character, center align",
            "test {0:*^10}",
            [1000],
            {},
            "test ***1000***"
        ],
        [
            "Custom fill character, center align, uneven split",
            "test {0:*^10}",
            [10001],
            {},
            "test **10001***"
        ],
        [
            "Custom fill character, negative value, left",
            "test {0:*<10}",
            [-1000],
            {},
            "test -1000*****"
        ],
        [
            "Custom fill character, negative value, right",
            "test {0:*>10}",
            [-1000],
            {},
            "test *****-1000"
        ],
        [
            "Custom fill character, negative value, center",
            "test {0:*^10}",
            [-1000],
            {},
            "test **-1000***"
        ],
        [
            "Custom fill character, negative value, '=' alignment",
            "test {0:*=10}",
            [-1000],
            {},
            "test -*****1000"
        ],
        [
            "Custom fill character, positive value, '=' alignment",
            "test {0:*=10}",
            [1000],
            {},
            "test ******1000"
        ],
        [
            "Custom fill character, positive value, +, <",
            "test {0:*<+10}",
            [1000],
            {},
            "test +1000*****"
        ],
        [
            "Custom fill character, positive value, +, >",
            "test {0:*>+10}",
            [1000],
            {},
            "test *****+1000"
        ],
        [
            "Custom fill character, positive value, +, ^",
            "test {0:*^+10}",
            [1000],
            {},
            "test **+1000***"
        ],
        [
            "Custom fill character, positive value, +, =",
            "test {0:*=+10}",
            [1000],
            {},
            "test +*****1000"
        ],
        [
            "Custom fill character, positive value, 'space' sign, <",
            "test {0:*< 10}",
            [1000],
            {},
            "test  1000*****"
        ],
        [
            "Custom fill character, positive value, 'space' sign, >",
            "test {0:*> 10}",
            [1000],
            {},
            "test ***** 1000"
        ],
        [
            "Custom fill character, positive value, 'space' sign, ^",
            "test {0:*^ 10}",
            [1000],
            {},
            "test ** 1000***"
        ],
        [
            "Binary representation",
            "test {0:b}",
            [1000],
            {},
            "test 1111101000"
        ],
        [
            "Octal representation",
            "test {0:o}",
            [1000],
            {},
            "test 1750"
        ],
        [
            "Hexadecimal representation",
            "test {0:x}",
            [1000],
            {},
            "test 3e8"
        ],
        [
            "Uppercase hexadecimal representation",
            "test {0:X}",
            [1000],
            {},
            "test 3E8"
        ],
        [
            "Binary representation with hash for 0b",
            "test {0:#b}",
            [1000],
            {},
            "test 0b1111101000"
        ],
        [
            "Octal representation hash for 0o",
            "test {0:#o}",
            [1000],
            {},
            "test 0o1750"
        ],
        [
            "Hexadecimal representation hash for 0x",
            "test {0:#x}",
            [1000],
            {},
            "test 0x3e8"
        ],
        [
            "Uppercase hexadecimal representation hash for 0x",
            "test {0:#X}",
            [1000],
            {},
            "test 0x3E8"
        ],
        [
            "Comma for thousands sep, no type specified",
            "test {0:,}",
            [1000],
            {},
            "test 1,000"
        ],
        [
            "Comma for thousands sep, type specified",
            "test {0:,g}",
            [1000],
            {},
            "test 1000"
        ],
        [
            "Leading zero on width causes 0-padding and =-alignment",
            "test {0:010}",
            [-1000],
            {},
            "test -000001000"
        ],
        [
            "Leading zero on width with > alignment",
            "test {0:>010}",
            [-1000],
            {},
            "test 00000-1000"
        ],
        [
            "Character repesentation",
            "test {0:c}",
            [0x0054],
            {},
            "test T"
        ],
        [
            "Decimal repesentation",
            "test {0:d}",
            [1234],
            {},
            "test 1234"
        ],
        [
            "Exponent repesentation",
            "test {0:e}",
            [1234],
            {},
            "test 1.234e+3"
        ],
        [
            "Uppercase exponent repesentation",
            "test {0:E}",
            [1234],
            {},
            "test 1.234E+3"
        ],
        [
            "Fixed precision",
            "test {0:.2f}",
            [1234.5678],
            {},
            "test 1234.57"
        ],
        [
            "Fixed precision 0",
            "test {0:.0f}",
            [1234.5678],
            {},
            "test 1235"
        ],
        [
            "Fixed precision 10",
            "test {0:.10f}",
            [1234.5678],
            {},
            "test 1234.5678000000"
        ],
        [
            "General format, two figures",
            "test {0:.2g}",
            [1234.5678],
            {},
            "test 1200"
        ],
        [
            "General format, six figures",
            "test {0:.6g}",
            [1234.5678],
            {},
            "test 1234.57"
        ],
        [
            "General format, massive number, check exponent",
            "test {0:.10g}",
            [123456789123456789123456789.123456789],
            {},
            "test 1.234567891e+26"
        ],
        [
            "General format, massive number, capital exponent",
            "test {0:.10G}",
            [123456789123456789123456789.123456789],
            {},
            "test 1.234567891E+26"
        ],
        [
            "Locale format",
            "test {0:n}",
            [12345678.9123],
            {},
            "test " + (12345678.9123).toLocaleString()
        ],
        [
            "Percentage format",
            "test {0:%}",
            [0.34],
            {},
            "test 34%"
        ],

        ["Empty string", "", [], {}, ""]
    ];


    /*
     * Run tests
     */
    for (i=0; i < tests.length; i++) {
        if ( typeof(tests[i]) == "string") {
            module(tests[i]);
        }
        else {
            (function(){
                var title, template, arr, obj, right;
                title = tests[i][0];
                template = tests[i][1];
                arr = tests[i][2];
                obj = tests[i][3];
                right = tests[i][4];
                test(title, function() {
                    var f = new Format(template);
                    equals(f.vformat(arr, obj), right);
                });
            }());
        }
    }
});



