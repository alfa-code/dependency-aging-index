const fs = require("fs");
const path = require('path');

const semver = require('semver');
const chalk = require('chalk');
const validUrl = require('valid-url');
var axios = require('axios');

/**
 * Final report
 */
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

/**
 * The purpose can be seen from the name of the function
 */
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

/**
 * Returns a promise that should return the latest version of the library
 * @param {String} libName 
 * @returns {Promise}
 */
async function getLibraryVersions(libName, registry) {
    return new Promise(async (resolve, reject) => {
        try {
            const url = registry + libName;
            const response = await axios({
                method: 'get',
                url: url
            });
            const versions = Object.keys(response.data.time).splice(2);

            const lastVersion = versions.slice(-1)[0];

            resolve(lastVersion);
        } catch(e) {
            reject(e);
        }
    });
}

/**
 * Returns a promise that should return data about the current and latest version of the library
 * @param {Object} dependencies
 * @param {String} libName
 * @returns {Promise}
 */
function getCurrentAndLatestVerionPromise(dependencies, libName, registry) {
    return new Promise(async (resolve, reject) => {
        try {
            const version = dependencies[libName];
            const currentVersionObj = semver.coerce(version);
            if (currentVersionObj && currentVersionObj.raw) {
                const currentVersion = currentVersionObj.raw;
                console.log('Get info by' + libName);
                const lastVersion = await getLibraryVersions(libName, registry);

                resolve({ libName, currentVersion, lastVersion });
            } else {
                // TODO: сделать учет проваленных зависимостей.
            }
        } catch (e) {
            reject();
        }
    })
}

/**
 * The function gets information about libraries, compares them, and outputs a report. Returns the error code from the program if necessary.
 * @param {Object} dependencies 
 */
async function checkLibrares(dependencies, maxIndex, errorCodeReturn, registry, customBadMessage) {
    // Counting the time spent
    var start = process.hrtime();
    var elapsed_time = function(note){
        var precision = 3; // 3 decimal places
        var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
        console.log(process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note); // print message + time
        start = process.hrtime(); // reset the timer
    }

    const promises = [];

    for (const libName in dependencies) {
        if (Object.hasOwnProperty.call(dependencies, libName)) {
            promises.push(getCurrentAndLatestVerionPromise(dependencies, libName, registry));
        }
    }

    console.log('Calculate the diff...');
    await Promise.all(promises).then((values) => {
        values.forEach(({libName, currentVersion, lastVersion}) => {

            console.log(`${libName} currentVersion:`, currentVersion);
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
        });
    }).catch((e) => {
        console.log('Error:', e);
    });

    const score = calculateAndSetAgingScore(report);

    console.log('Final report: ', {
        "Number of root dependencies": report.libChecksCount,
        "Report": report.counter
    });

    console.log('max dependency aging index is: ', maxIndex);

    console.log('\n Final assessment of dependency deprecation: ', score);

    elapsed_time('Time spent comparing all libraries.');

    const defaultBadMessage = `
\n
Your dependencies are very outdated! We need to update it urgently!
\n
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⣿⣿⣿⣿⡏⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠁⠀⠀⢹⣿⣿⣿⡇⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠈⣿⣿⣿⠀⠀⠀⠀⣿⣿⣿⣿⠋⠀⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀⣿⣿⣿⡏⠀⠀⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⠀⠀⠀⢸⣿⣿⠀⠀⠀⠀⣿⣿⡿⠀⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠸⣿⣿⠀⠀⠀⠸⣿⣿⠃⠀⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡀⠀⠀⠀⠉⠁⠀⠀⠀⠀⠈⠀⠀⠀⠀⣾⣿⣾⡿⠋⠀⠀⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠉⠙⢿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⣿⠟⠁⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠈⠻⢿⣿⣿⣇⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⢀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣀⠀⠀⠀⠀⠉⠉⠛⠛⠻⠿⣶⣦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣷⡄⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⡀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⠀⠀⠀⠀⣼⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⢿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⡀⢀⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣏⣀⣹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⣿⣦⣀⣤⣤⣤⣤⣾⠿⠿⠿⣷⣤⣾⡿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⠀⠀⠀⠀⠻⠿⠋⠉⠙⠛⠁⠀⠀⠀⠈⠛⠃⠀⠀⠀⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
`;

    if (score > maxIndex) {
        console.log(chalk.white.bgRed.bold(customBadMessage || defaultBadMessage));
        if (errorCodeReturn) {
            console.log('process exit code: 1');
            process.exit(1);
        } else {
            console.log('process exit code: 0');
            process.exit(0);
        }
    } else if (score > 0 && score < maxIndex) {
        console.log(chalk.underline.white.bgYellow.bold('\n Some dependencies are deprecated. It\'s time to start updating!'));
        console.log('process exit code: 0');
        process.exit(0);
    } else if (score === 0) {
        console.log(chalk.underline.white.bgGreen.bold('\n Absolutely all dependencies are updated! You and your team are the best!'));
        console.log('process exit code: 0');
        process.exit(0);
    }
}

function getDependencies(pathToFile) {
    let package;

    if (!pathToFile) {
        package = fs.readFileSync(`${process.cwd()}/package.json`, "utf8");
    } else {
        const stats = fs.statSync(pathToFile);
        if (stats.isFile()) {
            package = fs.readFileSync(pathToFile, "utf8")
        } else if (stats.isDirectory()) {
            package = fs.readFileSync(path.join(pathToFile, 'package.json'), "utf8");
        }
    }

    let packageObj = JSON.parse(package);
    const { dependencies = {}, devDependencies = {} } = packageObj;
    console.log('dependencies: ', dependencies);
    console.log('devDependencies: ', devDependencies);
    return { ...dependencies, ...devDependencies };
}

/**
 * @param pathToPackageJSON {String|undefined} - Relative or Relative path to package.json file (May be a URL link)
 * @param options {Object|undefined}
 */
async function dai(pathToPackageJSON, options) {
    let dependencies;

    const defaultOption = {
        pathType: 'fs', // 'fs' - file system, 'url' - link to file to the internet
        maxIndex: 5000,
        errorCodeReturn: false,
        exceptions: [],
        registry: 'https://registry.npmjs.org/',
    }

    if (options === undefined) {
        options = defaultOption;
        console.warn('There are no options, the default parameters are used.');
    } else {
        options = {
            ...defaultOption,
            ...options
        }
    }

    const {
        pathType,
        maxIndex,
        errorCodeReturn,
        exceptions,
        registry,
        customBadMessage,
    } = options;

    switch (pathType) {
        case 'fs': {
            dependencies = getDependencies(pathToPackageJSON);
            break;
        }
        case 'url': {
            if (validUrl.isUri(pathToPackageJSON)){
                console.log('Looks like an URI');
                try {
                    console.log('Fetch package.json by URL...');
                    const response = await axios({
                        method: 'get',
                        url: pathToPackageJSON
                    });
            
                    const { data } = response;
                    const { dependencies: libraryDependencies = {}, devDependencies = {} } = data;
                
                    console.log('library dependencies:', libraryDependencies);
                    console.log('library devDependencies: ', devDependencies);
        
                    dependencies = { ...libraryDependencies , ...devDependencies };
                } catch (err) {
                    console.log('Couldn\'t get or parse package.json!', err);
                }
            } else {
                console.log('Not a URI');
                throw new Error('Not a URI');
            }
            break;
        }
        default: {
            console.log('The path Type value does not match any of the available ones');
        }
    }

    function filteringForExceptions(dependencies, exceptionsArray) {
        const filteredDependencies = {};
        Object.keys(dependencies).forEach((libName) => {
            if (!exceptionsArray.includes(libName)) {
                filteredDependencies[libName] = dependencies[libName];
            }
        });
        return filteredDependencies;
    }

    let filteredDependencies;
    if (exceptions.length > 0) {
        filteredDependencies = filteringForExceptions(dependencies, exceptions);
        console.log('Filtered Dependencies: ', filteredDependencies)
    }

    await checkLibrares(filteredDependencies || dependencies, maxIndex, errorCodeReturn, registry, customBadMessage);
}

module.exports = dai;

//
// curl https://registry.npmjs.org/@alfa-code/dependency-aging-index | jq .time
// curl http://binary.moscow.alfaintra.net/artifactory/api/npm/npm/@alfa-code/dependency-aging-index | jq .time
