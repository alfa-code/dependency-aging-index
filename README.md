# DAI - dependency-aging-index

[![npm version](https://badge.fury.io/js/%40alfa-code%2Fdependency-aging-index.svg)](https://badge.fury.io/js/%40alfa-code%2Fdependency-aging-index)

<p align="left">
	<img alt="madge" src="https://raw.githubusercontent.com/alfa-code/dependency-aging-index/main/src/assets/die.png" width="100">
</p>

If you do not update the libraries for a long time, and use the old versions, the project, sooner or later, will begin to die. No one needs it. This library provides a silly way to evaluate the importance of updating dependencies.

## How it works

Npm libraries have versions like 1.0.0 (https://semver.org/)
The package version is divided into three main groups: major, minor, patch. With this utility (dai), it is possible to analyze your package.json, calculate the difference between your dependency version and the latest one. If the number of such differences reaches a critical value, then it's time to update the libraries.

## Installation

```js
npm install -g @alfa-code/dependency-aging-index
```

```js
yarn global add @alfa-code/dependency-aging-index
```

## Usage

### Usage as a module

You can use the library as a module. Import the library into your project.

```js
const dai = require('./index');
```

The function takes two arguments:

- pathToPackageJSON (fyle system path or url)
- options (options object)

The options may contain:
```
{
  pathType: 'fs' | 'url'; // type of content // default 'fs'

  maxIndex: number; // max value of dependency aging index // default 5000

  errorCodeReturn: boolean; // If the value is set to true, then if the report exceeds the maximum dai value, the program will return code 1 (failure) after completion (can be useful for CI/CD) // default is false
  
  exceptions: array of strings; // list of exceptions libraries (libraries that don't need to be considered in the report)

  customBadMessage: string;
}
```

Then call the library with the necessary parameters. Examples:

```js
// call without options
dai();

// call with type and absolute path
dai('/Documents/projectName/', {
  pathType: 'fs'
});

// call with type and relative path
dai('./', {
  pathType: 'fs'
});

// call with type and relative path with package.json string
dai('./package.json', {
  pathType: 'fs'
});


// call as url
dai('https://raw.githubusercontent.com/alfa-code/dependency-aging-index/main/package.json', {
  pathType: 'url'
});
```

### Usage as a CLI util

After the global installation, the utility will be available from the terminal using the `dai` command. Run the dai command and follow the instructions.

After the analysis, you will get a report like:

```js
Final report:  {
  'Number of root dependencies': 85,
  'Report': {
    major: 39,
    premajor: 9,
    minor: 15,
    preminor: 0,
    patch: 10,
    prepatch: 1,
    prerelease: 1,
    noDiff: 10
  }
}
```

By default, the differences have the following weight:

```js
major: 1000,
premajor: 1000,
minor: 100,
preminor: 100,
patch: 10,
prepatch: 10,
prerelease: 0,
noDiff: 0
```

You will eventually get the total amount of **dai**:

```js
Final assessment of dependency deprecation: 49610
```

You will receive different messages depending on the amount of dai:

```
> 5000: Your dependencies are very outdated! We need to update it urgently!

> 0 < 5000: Some dependencies are deprecated. It's time to start updating!

0: Absolutely all dependencies are updated! You and your team are the best!
```

If the amount does not exceed the maximum, the program will finish execution with code 1, in other cases successfully with code 0.

Based on the program's exit code, you can make the appropriate decision. For example, with exit code 1, you can stop your CI, and force the developer to update several libraries.

If you are using a unix-like system, run the command **`echo $?`** - this way you will know the exit code of the last running program.

### TODO: Add the ability to configure dai values
