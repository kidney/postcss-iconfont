const path = require('path');
const url = require('url');
const Promise = require('bluebird');
const postcss = require('postcss');
const merge = require('merge');
const gulp = require('gulp');
const gulpIconfont = require('gulp-iconfont');

const POSTCSS_PLUGIN_NAME = 'postcss-iconfont';

const ABSOLUTE_URL = /^\//;

function errorLog(msg) {
    console.error(msg);
}
function isFunction(s) {
    return typeof s === 'function';
}
function trimQuotationMarks(val) {
    return val.replace(/^['"]{0,1}/, '').replace(/['"]{0,1}$/, '');
}
function include(arr,obj) {
    return (arr.indexOf(obj) !== -1);
}
function noop () {}

function extractsSVG (root, options) {
    return new Promise(function (resolve, reject) {
        let queueMap = [];

        // for each font face rule
        root.walkAtRules('font-face', function (rule) {
            let item = {};

            rule.walkDecls('src', function (decl) {
                let matchStr = decl.value.match(/^url\(['"]{0,1}(.*\.svg)['"]{0,1}\)/);
                if (matchStr && matchStr[1]) {
                    item.url = matchStr[1];
                }
            });

            if (!item.url) {
                return reject('src declaration not found in font-face rule.');
            }

            // for each font-family declaration
            rule.walkDecls('font-family', function (decl) {
                item.fontName = trimQuotationMarks(decl.value);
            });

            if (!item.fontName) {
                return reject('font-family not found in font-face rule.');
            }

            if (ABSOLUTE_URL.test(item.url)) {
                item.path = path.resolve(options.basePath + item.url);
            } else {
                item.path = path.resolve(path.dirname(root.source.input.file), item.url);
            }
            queueMap.push(item);
        });

        resolve([queueMap]);
    });
}

function prepare (queueMap, options) {
    return Promise.reduce(queueMap, function (newQueueMap, queueItem) {
        // filter options for gulp-iconfont options with options
        let iconFontOptions = merge({
            fontName: queueItem.fontName,
            log: noop // disabled print log from svgfont2svgicons
        }, options);
        delete iconFontOptions.basePath;
        delete iconFontOptions.stylesheetPath;
        delete iconFontOptions.publishPath;
        delete iconFontOptions.hooks;

        newQueueMap.push({
            path: queueItem.path,
            url: queueItem.url,
            iconFontOptions: iconFontOptions
        });

        return Promise.resolve(newQueueMap);
    }, []).then(function (newQueueMap) {
        return [newQueueMap];
    });
}

function runGulpIconFont (queueMap) {
    return Promise.map(queueMap, function (queueItem) {
        return new Promise(function (resolve, reject) {
            let glyphsResult;
            gulp.src([queueItem.path])
                .pipe(gulpIconfont(queueItem.iconFontOptions))
                .on('error', function (err) {
                    reject(err);
                }).on('glyphs', function (glyphs, opts) {
                    glyphsResult = {glyphs, opts};
                })
                .pipe(gulp.dest(queueItem.iconFontOptions.outputPath))
                .on('end', function () {
                    if (glyphsResult) {
                        resolve(glyphsResult);
                    } else {
                        reject('file not found');
                    }
                })
        });
    }).then(function (results) {
        return [results];
    });
}

function transformPOSIXSeparator(s) {
    return s.split(path.sep).join('/');
}

function createFontSrcDeclarationsWithEOT (stylesheetPath, options, result) {
    let fontUrl = path.relative(stylesheetPath, path.join(result.opts.outputPath, result.opts.fileName));
    fontUrl = url.resolve(options.publishPath, transformPOSIXSeparator(fontUrl));
    return 'url(\'' + fontUrl + '.eot\')';
}

function createFontSrcDeclarations(stylesheetPath, options, result) {
    let fontUrl = path.relative(stylesheetPath, path.join(result.opts.outputPath, result.opts.fileName));
    fontUrl = url.resolve(options.publishPath, transformPOSIXSeparator(fontUrl));
    let formats = result.opts.formats;

    let declarationArr = [];
    if (include(formats, 'eot')) {
        declarationArr.push('url(\'' + fontUrl + '.eot#iefix\') format(\'embedded-opentype\')');
    }
    if (include(formats, 'woff2')) {
        declarationArr.push('url(\'' + fontUrl + '.woff2\') format(\'woff2\')');
    }
    if (include(formats, 'woff')) {
        declarationArr.push('url(\'' + fontUrl + '.woff\') format(\'woff\')');
    }
    if (include(formats, 'svg')) {
        declarationArr.push('url(\'' + fontUrl + '.svg#' + result.opts.fontName + '\') format(\'svg\')');
    }
    return declarationArr.join(', \n       ');
}
function insertFontSrcDeclarations(rule, options, result) {
    const stylesheetPath = options.stylesheetPath || path.dirname(rule.parent.source.input.file);
    rule.walkDecls('src', function (decl) {
        // eot for < ie9
        if (include(result.opts.formats, 'eot')) {
            rule.insertBefore(decl, postcss.decl({
                prop: 'src',
                value: createFontSrcDeclarationsWithEOT(stylesheetPath, options, result)
            }));
        }

        rule.insertBefore(decl, postcss.decl({
            prop: 'src',
            value: createFontSrcDeclarations(stylesheetPath, options, result)
        }));

        decl.remove();
    });
}

/**
 * Insert glyphs css rules
 * @param rule
 * @param result
 */
function insertGlyphsRules(rule, result) {
    // Reverse order
    // make sure to insert the characters in ascending order
    let glyphs = result.glyphs.slice(0);
    let glyphLen = glyphs.length;
    while (glyphLen--) {
        let glyph = glyphs[glyphLen];
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
    }

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

function updateRule(root, options, results) {
    if (Array.isArray(results) && results.length) {
        results.forEach(function (item) {
            root.walkAtRules('font-face', function (rule) {
                let isInsert = false;
                rule.walkDecls('font-family', function (decl) {
                    if (trimQuotationMarks(decl.value) === item.opts.fontName) {
                        isInsert = true;
                    }
                });

                if (isInsert) {
                    insertFontSrcDeclarations(rule, options, item);
                    insertGlyphsRules(rule, item);

                    return false;
                }
            });

            if (isFunction(options.hooks.onUpdateRule)) {
                options.hooks.onUpdateRule(root, options, item);
            }
        });

        return Promise.resolve([root, results]);
    } else {
        return Promise.reject('updateRule results param not array');
    }
}

function iconFontPlugin (options) {
    // merge options
    options = merge({
        basePath: './',
        stylesheetPath: null,
        outputPath: './',
        publishPath: '',

        formats: ['svg', 'ttf', 'eot', 'woff'],
        hooks: {
            onUpdateRule: null
        }
    }, (options || {}));

    return function (root, result) {
        return extractsSVG(root, options)
            .spread(function (queueMap) {
                return prepare(queueMap, options);
            }).spread(function (queueMap) { // run gulp-iconfont generate fonts.
                return runGulpIconFont(queueMap);
            }).spread(function (results) { // update css rule.
                return updateRule(root, options, results);
            }).catch(function (err) {
                errorLog(POSTCSS_PLUGIN_NAME + ': An error occurred while processing files - ' + err.message);
                errorLog(err.stack);
                throw err;
            });
    };
}
module.exports = postcss.plugin(POSTCSS_PLUGIN_NAME, iconFontPlugin);
