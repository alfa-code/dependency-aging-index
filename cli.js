#!/usr/bin/env node
// making lib the article link - https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e

// const [,, ...args] = process.argv;

// TODO: доработать опции из package.json

// TODO: доработать разные языки

const fs = require("fs");

var inquirer = require('inquirer');
var axios = require('axios');
const chalk = require('chalk');

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
    const { dependencies = {}, devDependencies = {} } = packageObj;
    console.log('dependencies', dependencies);
    console.log('devDependencies', devDependencies);
    await checkLibrares({ ...dependencies, ...devDependencies });
}

async function urlPath() {
    const link = await new Promise((resolve, reject) => {
        inquirer.prompt([
            {
                type: "string",
                name: "link",
                message: "Предоставьте ссылку на package.json (RAW файл. Например https://raw.githubusercontent.com/alfa-code/dependency-aging-index/main/package.json)"
            },
            // TODO: докрутить basic аутентификацию
        ]).then(async (answers) => {
            console.log("answers", answers);
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
        try {
            const responce = await axios({
                method: 'get',
                url: link
            });
    
            const { data } = responce;
            const { dependencies = {}, devDependencies = {} } = data;
        
            console.log('dependencies', dependencies);
            console.log('devDependencies', devDependencies);

            await checkLibrares({ ...dependencies, ...devDependencies });
        } catch (err) {
            console.log('Не удалось получить или распалсить package.json!', err);
        }
    } else {
        console.log('Ссылка некорректна!');
    }
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
            const currentVersionObj = semver.coerce(version);
            if (currentVersionObj && currentVersionObj.raw) {
                // console.log('currentVersionObj', currentVersionObj);
                const currentVersion = currentVersionObj.raw;
                // console.log(`${libName} currentVersion: `, currentVersion);

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
            } else {
                // TODO: сделать учет проваленных зависимостей.
            }
        }
    }

    const score = calculateAndSetAgingScore(report);

    console.log('Final report: ', {
        "Number of root dependencies": report.libChecksCount,
        "Report": report.counter
    });

    console.log('\n Final assessment of dependency deprecation: ', score);

    if (score > 5000) {
        console.log(chalk.white.bgRed.bold('\n Your dependencies are very outdated! We need to update it urgently!'));
        process.exit(1);
    } else if (score > 0 && score < 5000) {
        console.log(chalk.underline.white.bgYellow.bold('\n Some dependencies are deprecated. It\'s time to start updating!'));
        process.exit(0);
    } else if (score === 0) {
        console.log(chalk.underline.white.bgGreen.bold('\n Absolutely all dependencies are updated! You and your team are the best!'));
        process.exit(0);
    }
}

function main() {
    inquirer.prompt([
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
                console.log('Вы не выбрали ни один из ответов.');
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
    console.error("Возникла ошибка. Подробнее: ", err);
}

