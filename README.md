# DAI - dependency-aging-index

[![npm version](https://badge.fury.io/js/%40alfa-code%2Fdependency-aging-index.svg)](https://badge.fury.io/js/%40alfa-code%2Fdependency-aging-index)

<p align="left">
	<img alt="madge" src="https://raw.githubusercontent.com/alfa-code/dependency-aging-index/main/die.png" width="100">
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
