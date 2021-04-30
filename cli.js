#!/usr/bin/env node
// article link - https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e

// const [,, ...args] = process.argv;

// console.log(`Hello World ${JSON.stringify(args)}`);

// https://raw.githubusercontent.com/alfa-code/dependency-aging-index/main/package.json

var inquirer = require('inquirer');
var axios = require('axios');
// var NpmApi = require('npm-api');

// const { exec } = require("child_process");

// const defaultRegistry = 'https://registry.npmjs.org/';

// let npm = new NpmApi();

// var repo = npm.repo('axios');

const semver = require('semver');

const report = {
    libraresCount: 0,
    colorCount: {
        major: 0,
        premajor: 0,
        minor: 0,
        preminor: 0,
        patch: 0,
        prepatch: 0,
        prerelease: 0,
        null: 0
    },
    verbose: []
}

// exec("npm view axios versions --json", (error, stdout, stderr) => {
//     if (error) {
//         console.log(`error: ${error.message}`);
//         return;
//     }
//     if (stderr) {
//         console.log(`stderr: ${stderr}`);
//         return;
//     }
//     console.log(`stdout: ${stdout}`);
// });

// npm view axios versions --json

// console.log('repo', repo)

// repo.package()
//   .then(function(pkg) {
//     console.log(pkg);
//   }, function(err) {
//     console.error(err);
//   });

inquirer
  .prompt([
    /* Pass your questions in here */
    {
        type: "string",
        name: "link",
        message: "Предоставьте ссылку на package.json (RAW файл. Например https://raw.githubusercontent.com/repoName/main/package.json)"
    },
    {
        type: "list",
        name: "isPublic",
        message: "Это публичный репозиторий?",
        choices: ["Да", "Нет"]
    }
  ])
  .then(async (answers) => {
    // Use user feedback for... whatever!!
    console.log("answers", answers);

    const { data } = await axios({
        method: 'get',
        url: 'https://raw.githubusercontent.com/alfa-code/dependency-aging-index/main/package.json'
    });

    console.log('data', data);

    const { dependencies } = data;

    console.log('dependencies', dependencies);
  })
  .catch(error => {
    console.log(error)
    if(error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
      
    } else {
      // Something else went wrong
    }
});

// console.log(semver.coerce('^1.2.3'))
