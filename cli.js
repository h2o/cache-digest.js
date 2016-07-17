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

vm.runInThisContext(fs.readFileSync(__dirname + "/cache-digest.js", "ascii"));

function main(argv) {
    var pbits = 7;
    var useBase64 = false;

    argv.shift();
    argv.shift();
    while (argv.length != 0 && argv[0].match(/^-/) != null) {
        var opt = argv.shift();
        if (opt == "-")
            break;
        if (opt == "-h" || opt == "--help") {
            console.log("Usage: node cmd.js [-b] [-p=pbits] URL1 URL2...")
            return 0;
        } else if (opt == "-b") {
            useBase64 = 1;
        } else if (opt.match(/^-p(?:(=(.*))|$)/) != null) {
            if (RegExp.$1 != "") {
                pbits = RegExp.$2 - 0;
            } else if (argv.length == 0) {
                console.error("argument value missing for option: -p");
                return 1;
            } else {
                pbits = argv.shift() - 0;
            }
        } else {
            console.error("Unknown option: %s", opt);
            return 1;
        }
    }

    var digest = calcDigestValue(argv, pbits);
    if (digest == null) {
        console.error("failed to calculate the digests");
        return 1;
    }

    if (useBase64) {
        console.log("%s", base64Encode(digest));
    } else {
        fs.createWriteStream(null, {fd: 1, defaultEncoding: "binary"}).write(Buffer.from(digest));
    }

    return 0;
}

process.exit(main(process.argv));
