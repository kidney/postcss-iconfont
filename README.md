# postcss-iconfont
> Create SVG/TTF/EOT/WOFF/WOFF2 fonts from several SVG icons with [PostCSS](http://postcss.org/).

[![npm](https://img.shields.io/npm/v/postcss-iconfont.svg)](https://www.npmjs.com/package/postcss-iconfont)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/kidney/postcss-iconfont/master/LICENSE)


[中文文档](https://github.com/kidney/postcss-iconfont/blob/master/README.zh-CN.md)


`postcss-iconfont` is based on `gulp-iconfont`,  In the `postcss` or `webpack` environment, it is easier to convert `svg` to webfont.

## Installation

Install `postcss-iconfont` as a development dependency:

```shell
npm install postcss-iconfont --save-dev
```



## Usage

### Node

Use [iconfont](https://github.com/kidney/postcss-iconfont) in your script:

```javascript
var postcss = require('postcss');
var iconfont = require('postcss-iconfont');

var options = {
    outputPath: './dist/fonts/'
};

postcss([iconfont(options)])
    .process(css)
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
        }
    }),
...
]
```




## Options

### basePath

Your base path that will be used for svg files with absolute CSS urls.

Type: `String`

Default: `./`

### stylesheetPath

Relative path to the folder that will keep your stylesheet file.

Type: `String`

Default: `null`


### outputPath

Relative path to the folder that will keep your output font file.

Type: `String`

Default: `./`


### publishPath

The url to the output directory resolved relative to the HTML page

Type: `String`

Default: ``


### formats

the same `gulp-iconfont`formats

Type: `String`

Default: `['svg', 'ttf', 'eot', 'woff']`


### hooks

Type: `Object`

Default: `{}`

#### hooks.onUpdateRule
Hook that allows to rewrite the CSS output.

Type: `function`

Default: `null`

### options.*
The [gulp-iconfont](https://github.com/nfroidure/gulp-iconfont/blob/master/README.md#options) are available:

- ~~options.fontName~~ (The configuration is invalid, and this value is taken in the style `font-family`)
- options.autohint
- options.fontWeight
- options.fontStyle
- options.fixedWidth
- options.centerHorizontally
- options.normalize
- options.fontHeight
- options.round
- options.descent
- options.metadata
- options.startUnicode
- options.prependUnicode
- options.timestamp


## Preparing SVG's

See: https://github.com/nfroidure/gulp-iconfont#preparing-svgs



## Example

```shell
└┬ demo/
 ├─┬ css/
 │ └─ style.css
 ├── fonts/
 └─┬ svg/
   ├─ arrow-up-left.svg
   └─ arrow-up-right.svg
```

style.css

```css
// before
@font-face {
  font-family: 'iconfont';
  src: url('./fonts/*.svg');
  font-weight: normal;
  font-style: normal;
}
```

```css
// after
@font-face {
  font-family: 'iconfont';
  src:  url('fonts/iconfont.eot');
  src:  url('fonts/iconfont.eot#iefix') format('embedded-opentype'),
    url('fonts/iconfont.ttf') format('truetype'),
    url('fonts/iconfont.woff') format('woff'),
    url('fonts/iconfont.svg?#iconfont') format('svg');
  font-weight: normal;
  font-style: normal;
}

[class^="iconfont-"], [class*=" iconfont-"] {
  font-family: 'iconfont' !important;
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.iconfont-arrow-up-left:before {
  content: "\EA01";
}
.iconfont-arrow-up-right:before {
  content: "\EA02";
}
```
