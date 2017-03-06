# postcss-iconfont
> Create SVG/TTF/EOT/WOFF/WOFF2 fonts from several SVG icons with [PostCSS](http://postcss.org/).

[![npm](https://img.shields.io/npm/v/postcss-iconfont.svg)](https://www.npmjs.com/package/postcss-iconfont)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/kidney/postcss-iconfont/master/LICENSE)



## Usage

First, install `postcss-iconfont` as a development dependency:

```shell
npm install postcss-iconfont --save-dev
```

Then, 

### Node

Use [iconfont](https://github.com/kidney/postcss-iconfont) in your script:

```javascript
var postcss = require('postcss');
var iconfont = require('postcss-iconfont');

var options = {
    outputPath: './dist/fonts/'
};

postcss([iconfont(options)])
    .process(css, {
        from: './css/style.css',
        to: './dist/style.css'
    })
    .then(function(result) {
        fs.writeFileSync('./dist/style.css', result.css);
    });
```

### Webpack

Use [iconfont](https://github.com/kidney/postcss-iconfont) in your webpack.config.js:

*Webpack 1.x*

```js
postcss: function () {
    return [
        ...
        iconfont({
            outputPath: './dist/fonts/'
        })
        ...
    ];
}
```

*Webpack 2.x*
```js
plugins: [
    new webpack.LoaderOptionsPlugin({
        options: {
            ...
            postcss: [
                ...
                iconfont({
                    outputPath: './dist/fonts/'
                })
            ]
        },
    }),
...
]
```


## Options

