const { program } = require('commander');
const memento = require('./lib/memento.js');

const DEFAULT_TIME_GATE = 'http://web.archive.org/web/timemap/link/';

program
  .name('memento-cli')
  .version('1.0.0')
  .description('CLI to Memento')
  .argument('<url>', 'url to fetch')
  .option('-t, --timegate <url>', 'TimeGate url', DEFAULT_TIME_GATE)
  .option('-s, --since <date>', 'Memento\'s since')
  .action( async (url, options) => {
      let opts = {
        host: options['timegate'],
      };

      if (options['since']) {
        opts['time'] = parseDate(options['since']);
      }
      
      await do_memento(url,opts);
  });

program.parse();

async function do_memento(url,opts) {
    const res = await memento(url,opts);
    console.log(res);
}

function parseDate(str) {
    return (new Date(str)).toUTCString();
}
