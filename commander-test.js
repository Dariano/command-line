const program = require('commander')
require('dotenv').config({
    path: `${__dirname}/.env`
})

var jenkins = require('jenkins')({
    baseUrl: `http://${process.env.USER_JENKINS}:${process.env.TOKEN_JENKINS}@${process.env.HOST_JENKINS}`,
    crumbIssuer: false
});

// program
//     .version('0.1.0')
//     .command('build <project>')
//     .option('-d, --dev', 'Branch the service.')
//     .action((project, cmd) => {
//         console.log('rmdir %s', project);
//         const parameters = {
//             buildRefresh: 1,
//             email: 'governanca.ti@agib@nk.com.br',
//             replicas: 1
//         }
    
//         const branch = cmd.dev ? 'dev' : 'hlg'

//         jenkins.job.build({ name: `${project}/${branch}`, parameters }, (err, data) => {
//             if (err) throw err;

//             console.log('queue item number', data);
//         });
//     });

// program.parse(process.argv);

// function range(val) {
//     return val.split('..').map(Number);
//   }
  
//   function list(val) {
//     return val.split(',');
//   }
  
//   function collect(val, memo) {
//     memo.push(val);
//     return memo;
//   }
  
//   function increaseVerbosity(v, total) {
//     return total + 1;
//   }

// program
//   .version('0.1.0')
//   .usage('[options] <file ...>')
//   .option('-i, --integer <n>', 'An integer argument', parseInt)
//   .option('-f, --float <n>', 'A float argument', parseFloat)
//   .option('-r, --range <a>..<b>', 'A range', range)
//   .option('-l, --list <items>', 'A list', list)
//   .option('-o, --optional [value]', 'An optional value')
//   .option('-c, --collect [value]', 'A repeatable value', collect, [])
//   .option('-v, --verbose', 'A value that can be increased', increaseVerbosity, 0)
//   .parse(process.argv);

// console.log(' int: %j', program.integer);
// console.log(' float: %j', program.float);
// console.log(' optional: %j', program.optional);
// program.range = program.range || [];
// console.log(' range: %j..%j', program.range[0], program.range[1]);
// console.log(' list: %j', program.list);
// console.log(' collect: %j', program.collect);
// console.log(' verbosity: %j', program.verbose);
// console.log(' args: %j', program.args);

program
  .version('0.1.0')
  .command('install [name]', 'install one or more packages')
  .command('search [query]', 'search with optional query')
  .command('list', 'list packages installed', {isDefault: true})
  .parse(process.argv);

  console.log(process.argv)