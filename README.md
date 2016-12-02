# cache-digest.js

[![Build Status](https://travis-ci.org/h2o/cache-digest.js.svg?branch=master)](https://travis-ci.org/h2o/cache-digest.js)

[Service Worker](https://developer.mozilla.org/docs/Web/API/Service_Worker_API) implementation of [Cache Digests for HTTP/2 (draft 01)](https://tools.ietf.org/html/draft-kazuho-h2-cache-digest-01)

## Warning


* WIP; the code is in early-beta stage
* only supports sending of _fresh_ digests without etag

## How to Use

1. install cache-digest.js into the root directory of the website
2. add `<script src="/cache-digest.js"></script>` to your web pages
3. adjust the web server configuration to send:
 * `service-worker-allowed: /` response header
 * `link: <push-URL>; rel="preload"` response header (see [spec](https://w3c.github.io/preload/))

## Command Line Interface

```bash
Usage: cache-digest [-b] [-p=pbits] URL1 URL2...
```

Install using NPM to provide a command line interface.

```bash
# locally for npm scripts
npm install cache-digest-cli

# or globally for system-wide use
npm install --global cache-digest-cli
```

Example:
```bash
cache-digest -b https://example.com/style.css https://example.com/jquery.js https://example.com/shortcut.css
# Output: EeUM-QA
```

### Options

#### `-b`

Encode the digest as per the [base64url](https://tools.ietf.org/html/rfc4648#section-5) specification.

If this option is not specified the output is streamed as raw binary data to `STDOUT`.

#### `-p=pbits`

Where **pbits** is an integer representing the probability of collisions. Maximum 31 bits per hash.

#### `-h` or `--help`

Display help information.
