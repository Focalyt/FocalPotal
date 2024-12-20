// const mongoose = require('mongoose');
// const { prompt } = require('inquirer');
// const chalk = require('chalk');

// const { log } = console;
// const citiesTag = 'Countries/States/Cities';

// log('\t\t', chalk.red.bold.underline('Welcome to DB utility!'));
// log('\n');
// log(chalk.green('Please follow the instructions to seed the db with default data!'));
// log('\n');

// const questions = [{
//   type: 'input',
//   name: 'dbServer',
//   message: 'Server host:',
//   default: () => 'localhost',
//   validate(value) {
//     if (!value || !value.trim()) return 'Enter a valid host name!';
//     return true;
//   },
// }, {
//   type: 'number',
//   name: 'dbPort',
//   message: 'Server port:',
//   default: () => 27017,
//   validate(value) {
//     if (value && typeof value === 'number') return true;
//     return 'Enter a valid port number!';
//   },
// }, {
//   type: 'input',
//   name: 'dbName',
//   message: 'Database name:',
//   default: () => 'rgcrm',
//   validate(value) {
//     if (!value || !value.trim()) return 'Enter a valid db name!';
//     return true;
//   },
// }];

// const startProcess = () => prompt([
//   {
//     type: 'checkbox',
//     message: 'Select Collections to Import',
//     name: 'collections',
//     choices: [
//       { name: citiesTag },
//     ],
//     validate(answer) {
//       if (answer.length < 1) return 'You must choose at least one topping.';
//       return true;
//     },
//   },
// ])
//   .then((answers) => {
//     const { collections } = answers;
//     let enableCity = false;
//     const cols = collections.map((x) => {
//       if (x !== citiesTag) return x;
//       enableCity = true;
//       return null;
//     }).filter(x => !!x);

//     if (enableCity) cols.push('countries', 'states', 'cities');

//     cols.forEach((col, i) => {
//       mongoose.connection.db.collection(col, (err, model) => {
//         if (err) throw err;
//         const data = jsonData[col];
//         return model.insertMany(data, (err2, docs) => {
//           if (err2) throw err2;
//           log(chalk.bold.green(
//     `${docs.insertedCount} documents added successfully for ${col}!`
// ));

//           if (i === cols.length - 1) log(chalk.bold.red('\nPress ctrl+c to exit!'));
//         });
//       });
//     });
//   })
//   .catch((err) => { throw err; });

// prompt(questions)
//   .then((answers) => {
//     const { dbServer, dbPort, dbName } = answers;

//     const dbUri = `mongodb://${dbServer}:${dbPort}/${dbName}`;

//     log('\n\t', chalk.green.bold('We are trying to connect to the db!'));

//     mongoose.set('useNewUrlParser', true);
//     mongoose.set('useFindAndModify', false);
//     mongoose.set('useCreateIndex', true);
//     return mongoose.connect(dbUri, (err) => {
//       if (err) throw new Error(err);
//       log(chalk.blue('\n', 'Yay! We are connected to the dB!'));

//       return startProcess();
//     });
//   })
//   .catch(err => log(chalk.red.bold(err.message)));
