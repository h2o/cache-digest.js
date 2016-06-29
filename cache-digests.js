/*
 * Copyright (c) 2015,2016 Jxck, DeNA Co., Ltd., Kazuho Oku
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
 *
 *
 * SHA256 implementation is based on https://github.com/emn178/js-sha256/,
 * licensed under the following copyright:
 *
 * Copyright (c) 2015 Chen Yi-Cyuan
 *
 * MIT License
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

if (typeof self !== "undefined" && "ServiceWorkerGlobalScope" in self &&
    self instanceof ServiceWorkerGlobalScope) {

    /* ServiceWorker */
    function openCache() {
        return caches.open("v1");
    }
    function logRequest(req) {
        var s = req.method + " " + req.url + "\n";
        for (var nv of req.headers.entries())
            s += nv[0] + ": " + nv[1] + "\n";
        console.log(s);
    }
    function logEvent(name, req) {
        console.log(name + ":" + req.url);
    }
    self.addEventListener('fetch', function(evt) {
        var req = evt.request.clone();
        logRequest(req);
        if (req.url.match(/\/cache-digests\.js(?:\?|$)/)) {
            logEvent("skip", req);
            return;
        }
        logEvent("start", req);
        evt.respondWith(openCache().then(function (cache) {
            return cache.match(req).then(function (res) {
                if (res && isFresh(res.headers.entries(), Date.now())) {
                    logEvent("hit", req);
                    return res;
                }
                logEvent("miss", req);
                return generateCacheDigest(cache).then(function (digest) {
                    console.log("cache-digest: " + digest);
                    if (digest != null) {
                        // req = new Request(req, {headers: {"cache-digest", digest}});
                    }
                    logEvent("fetch", req);
                    return fetch(req).then(function (res) {
                        logEvent("fetched", req);
                        if (res.status == 200 && isFresh(res.headers.entries(), Date.now())) {
                            cache.put(req, res.clone());
                            logEvent("cached", req);
                        }
                        return res;
                    });
                });
            });
        }));
    });

} else if (typeof navigator !== "undefined") {

    /* bootstrap, loaded via <script src=...> */
    navigator.serviceWorker.register("/cache-digests.js", {scope: "./"}).then(function(reg) {
        console.log(reg.scope);
    }).catch(function(e) {
        console.log(e);
    });

} else {

    /* test */
    setTimeout(function () {
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
        ok(isFresh([["Expires", "Mon, 27 Jun 2016 02:12:35 GMT"]], Date.parse("2016-06-27T02:12:00Z")), "expires-fresh");
        ok(!isFresh([["Expires", "Mon, 27 Jun 2016 02:12:35 GMT"]], Date.parse("2016-06-27T02:13:00Z")), "expires-stale");
        ok(!isFresh([["Cache-Control", "must-revalidate, max-age=600"]], Date.parse("2016-06-27T02:12:00Z")), "max-age-wo-date");
        ok(isFresh([["Cache-Control", "must-revalidate, max-age=600"], ["Date", "Mon, 27 Jun 2016 02:12:35 GMT"]], Date.parse("2016-06-27T02:22:00Z")), "max-age-fresh");
        ok(!isFresh([["Cache-Control", "must-revalidate, max-age=600"], ["Date", "Mon, 27 Jun 2016 02:12:35 GMT"]], Date.parse("2016-06-27T02:23:00Z")), "max-age-stale");
        is((new BitCoder).gcsEncode([], 2).value, []);
        is((new BitCoder).gcsEncode([3, 10], 2).value, [0b11101100]);
        is((new BitCoder).gcsEncode([1025], 8).value, [0b00001000, 0b00001000]);
        is(base64Encode(["h", "e", "l", "l", "o"].map(function (c) { return c.charCodeAt(0) })), "aGVsbG8");
        is(sha256(""), [0xe3b0c442, 0x98fc1c14, 0x9afbf4c8, 0x996fb924, 0x27ae41e4, 0x649b934c, 0xa495991b, 0x7852b855].map(function (v) { return v | 0; }), "sha256 empty string");
        is(sha256("hello world"), [0xb94d27b9, 0x934d3e08, 0xa52e52d7, 0xda7dabfa, 0xc484efe3, 0x7a5380ee, 0x9088f7ac, 0xe2efcde9].map(function (v) { return v | 0; }), "sha256 hello world");
        console.log("1.." + ntests);
        process.exit(failed ? 127 : 0);
    }, 0);

}

// returns a promise that returns the cache digest value
function generateCacheDigest(cache) {
    var hashes = [];
    return cache.keys().then(function (reqs) {
        // collect 31-bit hashes of fresh responses
        return Promise.all(reqs.map(function (req) {
            var now = Date.now();
            return cache.match(req).then(function (resp) {
                if (resp && isFresh(resp.headers.entries(), now))
                    hashes.push(sha256(req.url)[7] & 0x7fffffff);
            });
        })).then(function () {
            var pbits = 7;
            var nbits = Math.floor(Math.log(Math.max(hashes.length, 1)) / Math.log(2) + 0.7);
            if (nbits + pbits > 31)
                return null;
            for (var i = 0; i < hashes.length; ++i)
                hashes[i] &= 1 << (pbits + nbits) - 1;
            var digestValue = (new BitCoder).addBits(nbits, 5).addBits(pbits, 5).gcsEncode(hashes, pbits).value;
            return base64Encode(digestValue);
        });
    });
}

function isFresh(headers, now) {
    var date = 0, maxAge = null;
    for (var nv of headers) {
        var name = nv[0], value = nv[1];
        if (name.match(/^expires$/i) != null) {
            var parsed = Date.parse(value);
            if (parsed && parsed > now)
                return true;
        } else if (name.match(/^cache-control$/i) != null) {
            var directives = value.split(/\s*,\s*/);
            for (var d of directives) {
                if (d.match(/^\s*no-(?:cache|store)\s*$/) != null) {
                    return false;
                } else if (d.match(/^\s*max-age\s*=\s*([0-9]+)/) != null) {
                    maxAge = Math.min(RegExp.$1, maxAge || Infinity);
                }
            }
        } else if (name.match(/^date$/i) != null) {
            date = Date.parse(value);
        }
    }

    if (maxAge != null) {
        if (date + maxAge * 1000 > now)
            return true;
    }

    return false;
}

function BitCoder() {
    this.value = [];
    this.leftBits = 0;
}

BitCoder.prototype.addBit = function (b) {
    if (this.leftBits == 0) {
        this.value.push(0);
        this.leftBits = 8;
    }
    --this.leftBits;
    if (b)
        this.value[this.value.length - 1] |= 1 << this.leftBits;
    return this;
};

BitCoder.prototype.addBits = function (v, nbits) {
    if (nbits != 0) {
        do {
            --nbits;
            this.addBit(v & (1 << nbits));
        } while (nbits != 0);
    }
    return this;
};

BitCoder.prototype.gcsEncode = function (values, bits_fixed) {
    values = values.sort(function (a, b) { return a - b; });
    var prev = -1;
    for (var i = 0; i != values.length; ++i) {
        if (prev == values[i])
            continue;
        var v = values[i] - prev - 1;
        for (var q = v >> bits_fixed; q != 0; --q)
            this.addBit(0);
        this.addBit(1);
        this.addBits(v, bits_fixed);
        prev = values[i];
    }
    return this;
};

var base64Encode = function (buf) {
    var TOKENS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    return function base64Encode(buf) {
        var str = '';
        var quad;
        for (var pos = 0; buf.length - pos >= 3; pos += 3) {
            // concat 3 byte (4 token for base64)
            quad = buf[pos] << 16 | buf[pos + 1] << 8 | buf[pos + 2];
            // change each 6bit from top to char
            str += TOKENS[(quad >> 18)];
            str += TOKENS[(quad >> 12) & 63];
            str += TOKENS[(quad >>  6) & 63];
            str += TOKENS[quad & 63];
        }
        if (pos != buf.length) {
            quad = buf[pos] << 16;
            str += TOKENS[quad >> 18]; // first 6bit
            if (pos + 1 != buf.length) {
                quad |= buf[pos + 1] << 8;
                str += TOKENS[(quad >> 12) & 63];
                str += TOKENS[(quad >>  6) & 63];
            } else {
                str += TOKENS[(quad >> 12) & 63];
            }
        }
        return str;
    };
}();

/* based on https://github.com/emn178/js-sha256/, see top of the file */
var sha256 = function () {
    var EXTRA = [-2147483648, 8388608, 32768, 128];
    var SHIFT = [24, 16, 8, 0];
    var K =[0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    return function sha256(message) {
        var blocks = [];
        var code, first = true, end = false, i, j, index = 0, start = 0, bytes = 0, length = message.length, s0, s1, maj, t1, t2, ch, ab, da, cd, bc;
        var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
        var block = 0;

        do {
            blocks[0] = block;
            blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            for (i = start; index < length && i < 64; ++index) {
                code = message.charCodeAt(index);
                if (code < 0x80) {
                    blocks[i >> 2] |= code << SHIFT[i++ & 3];
                } else if (code < 0x800) {
                    blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                } else if (code < 0xd800 || code >= 0xe000) {
                    blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                } else {
                    code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
                    blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
                    blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                }
            }
            bytes += i - start;
            start = i - 64;
            if(index == length) {
                blocks[i >> 2] |= EXTRA[i & 3];
                ++index;
            }
            block = blocks[16];
            if(index > length && i < 56) {
                blocks[15] = bytes << 3;
                end = true;
            }

            var a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
            for(j = 16; j < 64; ++j) {
                // rightrotate
                t1 = blocks[j - 15];
                s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
                t1 = blocks[j - 2];
                s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
                blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
            }

            bc = b & c;
            for(j = 0; j < 64; j += 4) {
                if(first) {
                    ab = 704751109;
                    t1 = blocks[0] - 210244248;
                    h = t1 - 1521486534 << 0;
                    d = t1 + 143694565 << 0;
                    first = false;
                } else {
                    s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
                    s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
                    ab = a & b;
                    maj = ab ^ (a & c) ^ bc;
                    ch = (e & f) ^ (~e & g);
                    t1 = h + s1 + ch + K[j] + blocks[j];
                    t2 = s0 + maj;
                    h = d + t1 << 0;
                    d = t1 + t2 << 0;
                }
                s0 = ((d >>> 2) | (d << 30)) ^ ((d >>> 13) | (d << 19)) ^ ((d >>> 22) | (d << 10));
                s1 = ((h >>> 6) | (h << 26)) ^ ((h >>> 11) | (h << 21)) ^ ((h >>> 25) | (h << 7));
                da = d & a;
                maj = da ^ (d & b) ^ ab;
                ch = (h & e) ^ (~h & f);
                t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
                t2 = s0 + maj;
                g = c + t1 << 0;
                c = t1 + t2 << 0;
                s0 = ((c >>> 2) | (c << 30)) ^ ((c >>> 13) | (c << 19)) ^ ((c >>> 22) | (c << 10));
                s1 = ((g >>> 6) | (g << 26)) ^ ((g >>> 11) | (g << 21)) ^ ((g >>> 25) | (g << 7));
                cd = c & d;
                maj = cd ^ (c & a) ^ da;
                ch = (g & h) ^ (~g & e);
                t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
                t2 = s0 + maj;
                f = b + t1 << 0;
                b = t1 + t2 << 0;
                s0 = ((b >>> 2) | (b << 30)) ^ ((b >>> 13) | (b << 19)) ^ ((b >>> 22) | (b << 10));
                s1 = ((f >>> 6) | (f << 26)) ^ ((f >>> 11) | (f << 21)) ^ ((f >>> 25) | (f << 7));
                bc = b & c;
                maj = bc ^ (b & d) ^ cd;
                ch = (f & g) ^ (~f & h);
                t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
                t2 = s0 + maj;
                e = a + t1 << 0;
                a = t1 + t2 << 0;
            }

            h0 = h0 + a << 0;
            h1 = h1 + b << 0;
            h2 = h2 + c << 0;
            h3 = h3 + d << 0;
            h4 = h4 + e << 0;
            h5 = h5 + f << 0;
            h6 = h6 + g << 0;
            h7 = h7 + h << 0;
        } while (!end);

        return [h0, h1, h2, h3, h4, h5, h6, h7];
    };
}();
