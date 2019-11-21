/*
 * The MIT License (MIT)
 * Copyright (c) 2019 GameplayJDK
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

const MODULE_FS = require('fs');

const MODULE_REQUEST = require('request-promise-native');
const MODULE_CHEERIO = require('cheerio');

function loadConfiguration(filename) {
    var configuration = null;

    try {
        var configurationRaw = MODULE_FS.readFileSync(filename);
        configuration = JSON.parse(configurationRaw.toString());
    } catch (error) {
        console.log('(!) error: ' + error);
    }

    return configuration;
}

var configuration = loadConfiguration('configuration.json');

if (null === configuration) {
    console.log('(!) file configuration.json not found');

    return;
}

async function scrape(url) {
    var array = [];
    var index = 0;

    function addToArray(url) {
        array.push(url);
    }

    addToArray(url);

    function parseHref(url, href) {
        function testHrefExternal(href) {
            // https://regex101.com/r/D39o4z/1
            var regexp = new RegExp('^https?:\/\/', 'i');

            return regexp.test(href);
        }

        function testHrefAnchor(href) {
            // https://regex101.com/r/e9rqFw/1
            var regexp = new RegExp('^#', 'i');

            return regexp.test(href);
        }

        function testHrefRelative(href) {
            // https://regex101.com/r/tlaBcy/1
            var regexp = new RegExp('^\/', 'i');

            return regexp.test(href);
        }

        if (testHrefExternal(href)) {
            console.log('- external href: ' + href);

            return null;
        }

        if (testHrefAnchor(href)) {
            console.log('- anchor href: ' + href);

            return null;
        }

        if (testHrefRelative(href)) {
            console.log('- absolute href: ' + href);

            return (new URL(href, configuration.main));
        }

        console.log('- internal href: ' + href);

        return (new URL(href, url));
    }

    function makeRequestTo(url) {
        return MODULE_REQUEST({
            'uri': url,
            'method': 'get',
            'transform': function (body) {
                return MODULE_CHEERIO.load(body);
            },
        })
            .then(function ($) {
                var element = $('a[href]');

                element.each(function (index, element) {
                    var a = $(element);
                    var href = a.attr('href');

                    var someUrl = parseHref(url, href);

                    if (null !== someUrl) {
                        addToArray(someUrl);
                    }
                });
            })
            .catch(function (error) {
                console.log('(!) error: ' + error);
                console.log(error);
            });
    }

    function makeUnique(array) {
        return array.filter(function (value, index, array) {
            return array.map(function (url) {
                return url.pathname;
            }).indexOf(value.pathname) === index;
        });
    }

    for (let i = 0; i < array.length; i++) {
        if (-1 !== configuration.limit && index > configuration.limit) {
            break;
        }

        var someUrl = array[i];

        console.log('# now scraping: ' + someUrl + ' (' + i + ')');

        await makeRequestTo(someUrl);

        array = makeUnique(array);

        index++;
    }

    return array;
}

var url = new URL('/', configuration.main);
scrape(url).then(function (array) {
    console.log('---- result ----');
    console.log('# total: ' + array.length);

    var result = [];

    for (let i = 0; i < array.length; i++) {
        var someUrl = array[i];

        console.log('> ' + someUrl.pathname);

        result.push(someUrl.pathname);
    }

    var resultRaw = JSON.stringify(result, null, 2);

    try {
        MODULE_FS.writeFileSync(configuration.file, resultRaw);
    } catch (error) {
        console.log('(!) error: ' + error);
    }
});
