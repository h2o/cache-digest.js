/*
 * Copyright (c) 2016 DeNA Co., Ltd., Kazuho Oku
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
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

ok(isFresh([["Expires", "Mon, 27 Jun 2016 02:12:35 GMT"]][Symbol.iterator](), Date.parse("2016-06-27T02:12:00Z")), "expires-fresh");
ok(!isFresh([["Expires", "Mon, 27 Jun 2016 02:12:35 GMT"]][Symbol.iterator](), Date.parse("2016-06-27T02:13:00Z")), "expires-stale");
ok(!isFresh([["Cache-Control", "must-revalidate, max-age=600"]][Symbol.iterator](), Date.parse("2016-06-27T02:12:00Z")), "max-age-wo-date");
ok(isFresh([["Cache-Control", "must-revalidate, max-age=600"], ["Date", "Mon, 27 Jun 2016 02:12:35 GMT"]][Symbol.iterator](), Date.parse("2016-06-27T02:22:00Z")), "max-age-fresh");
ok(!isFresh([["Cache-Control", "must-revalidate, max-age=600"], ["Date", "Mon, 27 Jun 2016 02:12:35 GMT"]][Symbol.iterator](), Date.parse("2016-06-27T02:23:00Z")), "max-age-stale");
is((new BitCoder).gcsEncode([], 2).value, []);
is((new BitCoder).gcsEncode([3, 10], 2).value, [0b11101100]);
is((new BitCoder).gcsEncode([1025], 8).value, [0b00001000, 0b00001000]);
is(base64Encode(["h", "e", "l"].map(function (c) { return c.charCodeAt(0) })), "aGVs");
is(base64Encode(["h", "e", "l", "l"].map(function (c) { return c.charCodeAt(0) })), "aGVsbA");
is(base64Encode(["h", "e", "l", "l", "o"].map(function (c) { return c.charCodeAt(0) })), "aGVsbG8");
is(sha256(""), [0xe3b0c442, 0x98fc1c14, 0x9afbf4c8, 0x996fb924, 0x27ae41e4, 0x649b934c, 0xa495991b, 0x7852b855].map(function (v) { return v | 0; }), "sha256 empty string");
is(sha256("hello world"), [0xb94d27b9, 0x934d3e08, 0xa52e52d7, 0xda7dabfa, 0xc484efe3, 0x7a5380ee, 0x9088f7ac, 0xe2efcde9].map(function (v) { return v | 0; }), "sha256 hello world");
is(sha256Truncated("", 8), 0xe3);
is(sha256Truncated("", 5), 0x1c);
is(sha256Truncated("hello world", 11), 0x5ca);
is(calcDigestValue([], 7), [0x01, 0xc0]);
is(calcDigestValue(["https://example.com/style.css"], 7), [0x01, 0xf7, 0x40]);
is(calcDigestValue(["https://example.com/style.css", "https://example.com/jquery.js"], 7), [0x09, 0xd6, 0x50, 0xe0]);
is(calcDigestValue(["https://example.com/style.css", "https://example.com/jquery.js"], 4), [0x09, 0x16, 0x80]);
console.log("1.." + ntests);

process.exit(failed ? 127 : 0);
