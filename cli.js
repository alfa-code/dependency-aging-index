#!/usr/bin/env node
// making lib the article link - https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e

// const [,, ...args] = process.argv;

const fs = require("fs");

var inquirer = require('inquirer');
var axios = require('axios');

const { exec } = require("child_process");

const semver = require('semver');

const report = {
    libChecksCount: 0,
    counter: {
        major: 0,
        premajor: 0,
        minor: 0,
        preminor: 0,
        patch: 0,
        prepatch: 0,
        prerelease: 0,
        noDiff: 0
    },
    verbose: [],
    agingScore: 0
}

function calculateAndSetAgingScore(report) {
    const { counter } = report;
    let agingScore = 0;
    for (const key in counter) {
        if (Object.hasOwnProperty.call(counter, key)) {
            const value = counter[key];
            
            switch (key) {
                case 'major':
                case 'premajor': {
                    agingScore += (value * 1000);
                    break;
                }
                case 'minor':
                case 'preminor': {
                    agingScore += (value * 100);
                    break;
                }
                case 'patch':
                case 'prepatch': {
                    agingScore += (value * 10);
                    break;
                }
                case 'patch':
                case 'prerelease': {
                    agingScore += 0;
                    break;
                }
            }
        }
    }
    return agingScore;
}

async function localPath() {
    let package = fs.readFileSync(`${process.cwd()}/package.json`, "utf8");
    let packageObj = JSON.parse(package);
    const { dependencies } = packageObj;
    console.log('dependencies', dependencies);
    await checkLibrares(dependencies);
}

async function urlPath() {
    const { data } = await axios({
        method: 'get',
        url: 'https://raw.githubusercontent.com/alfa-code/dependency-aging-index/main/package.json'
    });

    const { dependencies } = data;

    console.log('dependencies', dependencies);

    await checkLibrares(dependencies);
}

async function getLibraryVersions(libName) {
    return new Promise((resolve, reject) => {
        exec(`npm view ${libName} versions --json`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                reject(error);
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                reject(stderr);
            }

            const versionsList = JSON.parse(stdout);

            const lastVersion = versionsList.slice(-1)[0];

            resolve(lastVersion);
        });
    });
}

async function checkLibrares(dependencies) {
    for (const libName in dependencies) {
        if (Object.hasOwnProperty.call(dependencies, libName)) {
            const version = dependencies[libName];
            const currentVersion = semver.coerce(version).raw;
            console.log(`${libName} currentVersion: `, currentVersion);

            const lastVersion = await getLibraryVersions(libName);

            console.log(`${libName} lastVersion:`, lastVersion);

            const versionsDiff = semver.diff(currentVersion, lastVersion);
            console.log(`${libName} current vs latest diff: `, versionsDiff);

            report.libChecksCount += 1;
            report.verbose.push({
                libName,
                currentVersion,
                lastVersion,
                versionsDiff: versionsDiff === null ? "noDiff" : versionsDiff
            });

            if (versionsDiff === null) {
                report.counter.noDiff += 1;
            } else {
                report.counter[versionsDiff] += 1;
            }
        }
    }

    const score = calculateAndSetAgingScore(report);

    console.log('Итоговый отчет: ', report.counter);

    console.log('Итоговая оценка: ', score);
}

inquirer
    .prompt([
        {
            type: "list",
            name: "selectPath",
            message: "Вы хотите прочитать package.json локально в текущей директории или указать прямую ссылку на package.json?",
            choices: [
                {
                    name: "Найти package.json в текущей директории",
                    value: 0,
                },
                {
                    name: "Указать ссылку на package.json",
                    value: 1,
                },
            ]
        },
        // {
        //     type: "string",
        //     name: "link",
        //     message: "Предоставьте ссылку на package.json (RAW файл. Например https://raw.githubusercontent.com/repoName/main/package.json)"
        // },
        // {
        //     type: "list",
        //     name: "isPublic",
        //     message: "Это публичный репозиторий?",
        //     choices: ["Да", "Нет"]
        // }
    ])
    .then(async (answers) => {
        // console.log("answers", answers);

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
                console.log('wtf');
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
