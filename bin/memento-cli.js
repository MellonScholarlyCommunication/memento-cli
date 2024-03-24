#!/usr/bin/env node

const { program } = require('commander');
const { memento } = require('../lib/memento.js');
const N3 = require('n3');
const { DataFactory } = N3;
const { namedNode, literal, quad } = DataFactory;

const DEFAULT_TIME_MAP_BASE = 'http://web.archive.org/web/timemap/link/'

program
  .name('memento-cli')
  .version('1.0.3')
  .description('CLI to Memento')
  .argument('<url>', 'url to fetch')
  .option('-m, --timemap', 'Parse as TimeMap')
  .option('-b, --base <url>', 'TimeMap base url', DEFAULT_TIME_MAP_BASE)
  .option('-s, --since <date>', 'Memento\'s since')
  .option('--turtle','Turtle output')
  .action( async (url, options) => {
      let opts = {
        base: options['base'],
        timemap: options['timemap'],
        turtle: options['turtle']
      };

      if (options['since']) {
        opts['time'] = parseDate(options['since']);
      }

      await do_memento(url,opts);
  });

program.parse();

async function do_memento(url,opts) {
    const res = await memento(url,opts);

    if (opts['turtle']) {
      const writer = new N3.Writer({ prefixes: { 
        "ietf": "http://www.iana.org/assignments/relation/" ,
        "dc": "http://purl.org/dc/terms/",
        "xsd": "http://www.w3.org/2001/XMLSchema#"
      }});

      for (let i = 0 ; i < res.length ; i++) {
        let subject = namedNode(url);

        writer.addQuad(
          quad (
            subject,
            namedNode('http://www.iana.org/assignments/relation/memento'),
            namedNode(res[i]['memento'])
          )
        );  
        writer.addQuad(
          quad (
            namedNode(res[i]['memento']),
            namedNode('http://purl.org/dc/terms/created'),
            literal(res[i]['datetime'],namedNode('http://www.w3.org/2001/XMLSchema#dateTime'))
          )
        );  

      }
      
      writer.end((error, result) => console.log(result));
    }
    else {
      console.log(JSON.stringify(res,null,2));
    }
}

function parseDate(str) {
    return (new Date(str)).toUTCString();
}
