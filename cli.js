#!/usr/bin/env node
// article link - https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e

// const [,, ...args] = process.argv;

// console.log(`Hello World ${JSON.stringify(args)}`);

// https://raw.githubusercontent.com/alfa-code/dependency-aging-index/main/package.json

var inquirer = require('inquirer');
var axios = require('axios');

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
  })
  .catch(error => {
    console.log(error)
    if(error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
      
    } else {
      // Something else went wrong
    }
  });
