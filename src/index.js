const path = require('path');
const Promise = require('bluebird');
const postcss = require('postcss');
const merge = require('merge');
const gulp = require('gulp');
const gulpIconfont = require('gulp-iconfont');

function errorLog(msg) {
    console.error(msg);
}

function trimQuotationMarks(val) {
    return val.replace(/^['"]{0,1}/, '').replace(/['"]{0,1}$/, '');
}
function include(arr,obj) {
    return (arr.indexOf(obj) !== -1);
}
function noop () {}

function createFontSrcDeclarationsWithEOT (options, result) {
    let fontPath = path.join(options.publishPath, result.opts.fileName);
    return 'url(\'' + fontPath + '.eot\')';
}

function createFontSrcDeclarations(options, result) {
    let fontPath = path.join(options.publishPath, result.opts.fileName);
    let formats = result.opts.formats;

    let declarationArr = [];
    if (include(formats, 'eot')) {
        declarationArr.push('url(\'' + fontPath + '.eot?#iefix\') format(\'embedded-opentype\')');
    }
    if (include(formats, 'woff2')) {
        declarationArr.push('url(\'' + fontPath + '.woff2\') format(\'woff2\')');
    }
    if (include(formats, 'woff')) {
        declarationArr.push('url(\'' + fontPath + '.woff\') format(\'woff\')');
    }
    if (include(formats, 'svg')) {
        declarationArr.push('url(\'' + fontPath + '.svg#' + result.opts.fontName + '\') format(\'svg\')');
    }
    return declarationArr.join(', ');
}

function extractsSVG (root) {
    let queueMap = [];

    // for each font face rule
    root.walkAtRules('font-face', function (rule) {
        let srcPath;
        let fontName;

        rule.walkDecls('src', function (decl) {
            let matchStr = decl.value.match(/^url\(['"]{0,1}(.*\.svg)['"]{0,1}\)/);
            if (matchStr && matchStr[1]) {
                srcPath = matchStr[1];
            }
        });

        // if (!srcPath) {
        //     error('src declaration not found in font-face rule.');
        // }
        // for each font-family declaration
        rule.walkDecls('font-family', function (decl) {
            fontName = trimQuotationMarks(decl.value);
        });

        // if (!fontName) {
        //     Promise.reject('font-family not found in font-face rule.');
        // }

        queueMap.push({
            srcPath: srcPath,
            fontName: fontName
        });
    });

    return queueMap;
}

function prepare (options, queueItem) {
    let iconFontOptions = merge({
        fontName: queueItem.fontName,
        log: noop // disabled print log from svgfont2svgicons
    }, options);
    delete iconFontOptions.basePath;
    delete iconFontOptions.outputPath;
    delete iconFontOptions.publishPath;

    return {
        srcPath: path.resolve(options.basePath, queueItem.srcPath),
        outputPath: path.resolve(options.basePath, options.outputPath),
        iconFontOptions: iconFontOptions
    };
}

function runGulpIconFont (queueItem) {
    return new Promise(function (resolve, reject) {
        gulp.src([queueItem.srcPath])
            .pipe(gulpIconfont(queueItem.iconFontOptions))
            .on('glyphs', function (glyphs, opts) {
                resolve({glyphs: glyphs, opts: opts});
            }).on('error', function () {
                reject();
            }).pipe(gulp.dest(queueItem.outputPath));
    });
}

function insertFontSrcDeclarations(rule, options, result) {
    rule.walkDecls('src', function (decl) {
        // eot for < ie9
        if (include(result.opts.formats, 'eot')) {
            rule.insertBefore(decl, postcss.decl({
                prop: 'src',
                value: createFontSrcDeclarationsWithEOT(options, result)
            }));
        }

        rule.insertBefore(decl, postcss.decl({
            prop: 'src',
            value: createFontSrcDeclarations(options, result)
        }));

        decl.remove();
    });
}

function insertGlyphsRules(rule, options, result) {
    result.glyphs.forEach(function (glyph) {
        let node = postcss.rule({
            selector: '.' + result.opts.fontName + '-' + glyph.name + ':before'
        });
        node.append(postcss.decl({
            prop: 'content',
            value: '\'\\' +
                glyph.unicode[0]
                    .charCodeAt(0)
                    .toString(16)
                    .toUpperCase()
                + '\''
        }));

        rule.parent.insertAfter(rule, node);
    });

    let node = postcss.rule({
        selector: '[class^="' + result.opts.fontName + '-"], [class*=" ' + result.opts.fontName + '-"]'
    });
    [
        {prop: 'font-family', value: '\'' + result.opts.fontName + '\''},
        {prop: 'speak', value: 'none'},
        {prop: 'font-style', value: 'normal'},
        {prop: 'font-weight', value: 'normal'},
        {prop: 'font-variant', value: 'normal'},
        {prop: 'text-transform', value: 'none'},
        {prop: 'line-height', value: 1},
        {prop: '-webkit-font-smoothing', value: 'antialiased'},
        {prop: '-moz-osx-font-smoothing', value: 'grayscale'}
    ].forEach(function (item) {
        node.append(postcss.decl({
            prop: item.prop,
            value: item.value
        }));
    });

    rule.parent.insertAfter(rule, node);
}

function updateRule(root, options, result) {
    root.walkAtRules('font-face', function (rule) {
        let isInsert = false;
        rule.walkDecls('font-family', function (decl) {
            if (trimQuotationMarks(decl.value) === result.opts.fontName) {
                isInsert = true;
            }
        });

        if (isInsert) {
            insertFontSrcDeclarations(rule, options, result);
            insertGlyphsRules(rule, options, result);

            return false;
        }
    });

    return root;
}

function iconFontPlugin (options) {
    // merge options
    options = merge({
        basePath: process.cwd(),
        outputPath: '',
        formats: ['svg', 'ttf', 'eot', 'woff']
    }, (options || {}));

    return function (root, result) {
        return Promise.map(extractsSVG(root), function(queueItem) {
            return prepare(options, queueItem);
        }).map(function (queueItem) { // run gulp-iconfont generate fonts.
            return runGulpIconFont(queueItem);
        }).map(function (result) { // update css rule.
            return updateRule(root, options, result);
        }).spread(function (root) {

        }).catch(function (err) {
            errorLog('postcss-iconfont: An error occurred while processing files - ' + err.message);
            errorLog(err.stack);
            throw err;
        });
    };
}

module.exports = postcss.plugin('postcss-iconfont', iconFontPlugin);
