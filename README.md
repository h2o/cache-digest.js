cache-digest.js
======

[![Build Status](https://travis-ci.org/h2o/cache-digest.js.svg?branch=master)](https://travis-ci.org/h2o/cache-digest.js)

[Service Worker](https://developer.mozilla.org/docs/Web/API/Service_Worker_API) implementation of [Cache Digests for HTTP/2 (draft 01)](https://tools.ietf.org/html/draft-kazuho-h2-cache-digest-01)

Warning
------

* WIP; the code is in early-beta stage
* only supports sending of _fresh_ digests without etag

How to Use
------

1. install cache-digest.js into the root directory of the website
2. add `<script src="/cache-digest.js"></script>` to your web pages
3. adjust the web server configuration to send:
 * `service-worker-allowed: /` response header
 * `link: <push-URL>; rel="preload"` response header (see [spec](https://w3c.github.io/preload/))

Calculating Digests at Command Line
------

You can run cli.js to calculate cache digests manually.

```
% node cli.js -b https://example.com/style.css https://example.com/jquery.js https://example.com/shortcut.css
EdcLLJA
```

In the above example, `-b` option is used so that the digest would be encoded using [base64url](https://tools.ietf.org/html/rfc4648#section-5). Please refer to `-h` (help) option for more information.
