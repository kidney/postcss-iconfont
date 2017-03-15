# postcss-iconfont
> 基于[PostCSS](http://postcss.org/) 处理多个SVG文件生成 SVG/TTF/EOT/WOFF/WOFF2 字体图标

[![npm](https://img.shields.io/npm/v/postcss-iconfont.svg)](https://www.npmjs.com/package/postcss-iconfont)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/kidney/postcss-iconfont/master/LICENSE)



`postcss-iconfont` 是基于 `gulp-iconfont` 进行封装,  在 `postcss` 或 `webpack` 的构建环境下，能更方便地把 `svg` 文件转换为 webfont。

## 安装

安装依赖 `postcss-iconfont`:

```shell
npm install postcss-iconfont --save-dev
```



## 用法

### Node

在script中使用 [iconfont](https://github.com/kidney/postcss-iconfont) ：

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

在 webpack.config.js 中使用  [iconfont](https://github.com/kidney/postcss-iconfont) ：

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

### stylesheetPath

样式文件所在的目录路径

类型：`String`

默认值：`process.cwd()`


### outputPath

生成的字体文件存放目录路径

类型：`String`

默认值：``


### publishPath

字体文件的发布路径

类型：`String`

默认值：``


### formats

生成的字体格式，详细查看 `gulp-iconfont` 的[formats](https://github.com/nfroidure/gulp-iconfont/blob/master/README.md#optionsformats)

类型：`String`

默认值：`['svg', 'ttf', 'eot', 'woff']`


### hooks

回调钩子

类型：`Object`

默认值：`{}`

#### hooks.onUpdateRule

更改CSS规则后触发的回调

类型：`function`

默认值：`null`

### options.*
[gulp-iconfont](https://github.com/nfroidure/gulp-iconfont/blob/master/README.md#options) 的配置也能使用:

- ~~options.fontName~~ （配置无效，这个值在样式中 `font-family` 中获取）
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




## 制作 SVG 文件

See: https://github.com/nfroidure/gulp-iconfont#preparing-svgs



## 例子

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
  font-family: 'font-awesome';
  src: url('./fonts/font-awesome/*.svg');
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
