const bodyLinks = require('iotdb-links');
const fetch = require('node-fetch');

const DEFAULT_TIME_GATE = 'http://web.archive.org/web/timemap/link/'

async function memento(url, opts) {
    let gateway = opts.host || DEFAULT_TIME_GATE;

    const headers = {};

    if (opts.time) {
        headers['Accept-Datetime'] = opts.time
    }

    const response = await fetch(gateway + url, { 
        method: 'GET' ,
        headers: headers
    });

    if (response.ok) {
        return await parsedResults(response);
    }
    else {
        console.error(gateway + url + ' didn\'t return a response : code = ' + response.status)
        return [];
    }
}

async function parsedResults(response) {
    let linkHeaders = response.headers['link'];

    let results;

    if (linkHeaders) {
        results = parsedBody(linkHeaders);
    }

    if (! results) {
        let parts = (await response.text()).split('\n');
        return parsedBody(parts);
    }
}

async function parsedBody(parts) {
    let links = [];

    for (let i = 0 ; i < parts.length ; i++) {
        let item = bodyLinks.parse(parts[i]);
        let url = Object.keys(item)[0];
        if (item[url] && item[url]['rel'] && item[url]['rel'].match(/.*memento.*/)) {
            links.push( {
                url: url ,
                datetime: (new Date(item[url]['datetime'])).toISOString()
            });
        }
    }
    return links;
}

module.exports = memento;