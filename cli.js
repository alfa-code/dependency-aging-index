#!/usr/bin/env node
// making lib the article link - https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e

const dai = require('./index');

// TODO: доработать аргументы из cli
// const [,, ...args] = process.argv;

// TODO: доработать опции из package.json

var inquirer = require('inquirer');

async function localPath() {
    dai(undefined, {
        pathType: 'fs'
    });
}

async function urlPath() {
    const link = await new Promise((resolve, reject) => {
        inquirer.prompt([
            {
                type: "string",
                name: "link",
                message: "Provide a link to the package.json (RAW file. For example https://raw.githubusercontent.com/alfa-code/dependency-aging-index/main/package.json)"
            },
            // TODO: докрутить basic аутентификацию
        ]).then(async (answers) => {
            // console.log("answers", answers);
            resolve(answers['link']);
        }).catch(error => {
            console.log(error)
            if (error.isTtyError) {
                reject(null);
            } else {
                reject(null);
            }
        });
    });

    if (link) {
        dai(link, {
            pathType: 'url'
        })
    } else {
        console.log('The link is incorrect!');
    }
}

function main() {
    inquirer.prompt([
        {
            type: "list",
            name: "selectPath",
            message: "Read the package.json locally in the current directory or specify a direct link to package.json?",
            choices: [
                {
                    name: "Find package.json in the current directory",
                    value: 0,
                },
                {
                    name: "Specify a link to package.json",
                    value: 1,
                },
            ]
        },
    ])
    .then(async (answers) => {
        switch (answers.selectPath) {
            case 0: {
                await localPath();
                break;
            }
            case 1: {
                await urlPath();
                break;
            }
            default: {
                console.log('You didn\'t choose any of the answers.');
                break;
            }
        }
    
        
    })
    .catch(error => {
        console.log(error)
        if (error.isTtyError) {
            // Prompt couldn't be rendered in the current environment
    
        } else {
            // Something else went wrong
        }
    });
}

try {
    main();
} catch (err) {
    console.error("An error occurred. More detailed: ", err);
}

