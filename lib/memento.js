const bodyLinks = require('iotdb-links');
const fetch = require('node-fetch');

const DEFAULT_TIME_MAP_BASE = 'http://web.archive.org/web/timemap/link/'

// Naive slow memento client, but it does some recursion in a bad way...
async function memento(url, opts) {
    let gateway = opts['base'] || DEFAULT_TIME_MAP_BASE;

    if (opts && opts['timemap']) {
        return await getAndParse(url,opts);
    }
    else {
        return await getAndParse(gateway + url, opts);
    }
}

async function getAndParse(url,opts) {
    const headers = {};

    if (opts && opts['time']) {
        headers['Accept-Datetime'] = opts['time']
    }

    const response = await fetch(url, { 
        method: 'GET' ,
        headers: headers
    });

    if (response.ok) {
        return await parsedResponse(response);
    }
    else {
        console.error(url + ' didn\'t return a response : code = ' + response.status)
        return [];
    }
}

async function parsedResponse(response) {
    let linkHeaders = response.headers['link'];

    let results;

    if (linkHeaders) {
        results = parsedBody(linkHeaders);
    }

    if (! results) {
        let parts = (await response.text())
                      .replace(/(\r\n|\n|\r)/gm, "")
                      .split(/,(?=[<])/)
        return parsedBody(parts);
    }
}

async function parsedBody(parts) {
    let links = [];

    let timemap = [];

    for (let i = 0 ; i < parts.length ; i++) {
        let item = bodyLinks.parse(parts[i]);
        let url = Object.keys(item)[0];
        if (item[url] && item[url]['rel'] && item[url]['rel'].match(/.*memento.*/)) {
            links.push( {
                memento: url ,
                datetime: (new Date(item[url]['datetime'])).toISOString()
            });
        }
        if (item[url] && item[url]['rel'] && item[url]['rel'] === 'timemap') {
            timemap.push(url);
        }
    }

    // Follow timemap recursions ...
    for (let i = 0 ; i < timemap.length ; i++) {
        let result = await getAndParse(timemap[i],{});
        links.push.apply(links,result);
    }

    return links;
}

module.exports = memento;