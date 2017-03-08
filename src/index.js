const path = require('path');
const Promise = require('bluebird');
const postcss = require('postcss');
const merge = require('merge');
const gulp = require('gulp');
const gulpIconfont = require('gulp-iconfont');

function extractsSVG (css) {
    let queueMap = [];

    // for each font face rule
    css.walkAtRules('font-face', function (rule) {
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
            fontName = decl.value.replace(/^['"]{0,1}/, '').replace(/['"]{0,1}$/, '');
        });

        // if (!fontName) {
        //     Promise.reject('font-family not found in font-face rule.');
        // }

        queueMap.push({
            srcPath: srcPath,
            fontName: fontName
        });
    });

    // queue.forEach(function (item) {
    //     options.fontName = item.fontName;
    //     generateFont({
    //         srcPath: path.resolve(BASE_PATH, item.srcPath),
    //         outputPath: OUTPUT_PATH,
    //         iconFontOptions: options,
    //         onComplete: function(glyphs, options) {
    //             // CSS templating, e.g.
    //             console.log(glyphs, options);
    //         }
    //     });
    // });

    return Promise.resolve([queueMap]);
}

function prepare (options, queueMap) {
    let outputPath = path.resolve(options.basePath, options.outputPath);

    queueMap.forEach(function (item, index) {
        let iconFontOptions = merge({
            fontName: item.fontName
        }, options);
        delete iconFontOptions.basePath;
        delete iconFontOptions.outputPath;

        queueMap[index] = {
            srcPath: path.resolve(options.basePath, item.srcPath),
            outputPath: outputPath,
            iconFontOptions: iconFontOptions
        };
    });

    return Promise.resolve([queueMap]);
}

function runGulpIconFont (queueItem) {
    return new Promise(function (resolve, reject) {
        gulp.src([queueItem.srcPath])
            .pipe(gulpIconfont(queueItem.iconFontOptions))
            .on('glyphs', function (glyphs, opts) {
                resolve([glyphs, opts]);
            }).on('error', function () {
                reject();
            }).pipe(gulp.dest(queueItem.outputPath));
    });
}

function writeStyleRules(glyphs, opts) {

}

function iconFontPlugin (options) {
    // merge options
    options = merge({
        basePath: process.cwd(),
        outputPath: '',
        formats: ['svg', 'ttf', 'eot', 'woff']
    }, (options || {}));

    /*const BASE_PATH = options.basePath;
    const OUTPUT_PATH = path.resolve(BASE_PATH, options.outputPath);
    delete options.basePath;
    delete options.outputPath;*/

    return function (css, result) {
        return extractsSVG(css)
            .spread(function (queueMap) {
                return prepare(options, queueMap);
            })
            .spread(function (queueMap) {
                return runGulpIconFont(queueMap[0]);
            })
            .spread(function (glyphs, opts) {
                return writeStyleRules(glyphs, opts);
            })
            .catch(function (err) {
                console.error('postcss-iconfont: An error occurred while processing files - ' + err.message);
                console.error(err.stack);
                throw err;
            });
    };
}

module.exports = postcss.plugin('postcss-iconfont', iconFontPlugin);
