"use strict";

var vm = require("vm");
var fs = require("fs");

var ntests = 0, failed = false;

function ok(b, name) {
    console.log((b ? "ok" : "not ok" ) + " " + ++ntests + " - " + name);
    if (!b)
        failed = true;
}

function is(result, expected, name) {
    if (Array.isArray(result)) {
        if (result.length != expected.length)
            return ok(false, name);
        for (var i = 0; i != result.length; ++i)
            if (result[i] !== expected[i])
                return ok(false, name);
        return ok(true, name);
    } else {
        return ok(result === expected, name);
    }
}

vm.runInThisContext(fs.readFileSync("cache-digest.js", "ascii"));

ok(isFresh([["Expires", "Mon, 27 Jun 2016 02:12:35 GMT"]], Date.parse("2016-06-27T02:12:00Z")), "expires-fresh");
ok(!isFresh([["Expires", "Mon, 27 Jun 2016 02:12:35 GMT"]], Date.parse("2016-06-27T02:13:00Z")), "expires-stale");
ok(!isFresh([["Cache-Control", "must-revalidate, max-age=600"]], Date.parse("2016-06-27T02:12:00Z")), "max-age-wo-date");
ok(isFresh([["Cache-Control", "must-revalidate, max-age=600"], ["Date", "Mon, 27 Jun 2016 02:12:35 GMT"]], Date.parse("2016-06-27T02:22:00Z")), "max-age-fresh");
ok(!isFresh([["Cache-Control", "must-revalidate, max-age=600"], ["Date", "Mon, 27 Jun 2016 02:12:35 GMT"]], Date.parse("2016-06-27T02:23:00Z")), "max-age-stale");
is((new BitCoder).gcsEncode([], 2).value, []);
is((new BitCoder).gcsEncode([3, 10], 2).value, [0b11101100]);
is((new BitCoder).gcsEncode([1025], 8).value, [0b00001000, 0b00001000]);
is(base64Encode(["h", "e", "l"].map(function (c) { return c.charCodeAt(0) })), "aGVs");
is(base64Encode(["h", "e", "l", "l"].map(function (c) { return c.charCodeAt(0) })), "aGVsbA");
is(base64Encode(["h", "e", "l", "l", "o"].map(function (c) { return c.charCodeAt(0) })), "aGVsbG8");
is(sha256(""), [0xe3b0c442, 0x98fc1c14, 0x9afbf4c8, 0x996fb924, 0x27ae41e4, 0x649b934c, 0xa495991b, 0x7852b855].map(function (v) { return v | 0; }), "sha256 empty string");
is(sha256("hello world"), [0xb94d27b9, 0x934d3e08, 0xa52e52d7, 0xda7dabfa, 0xc484efe3, 0x7a5380ee, 0x9088f7ac, 0xe2efcde9].map(function (v) { return v | 0; }), "sha256 hello world");
console.log("1.." + ntests);

process.exit(failed ? 127 : 0);
