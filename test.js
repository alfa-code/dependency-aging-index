const dai = require('./index');

dai('./', {
    pathType: 'fs',
    maxIndex: 100,
    exceptions: ['axios', 'valid-url']
});

dai('https://raw.githubusercontent.com/alfa-code/dependency-aging-index/main/package.json', {
    pathType: 'url',
});

