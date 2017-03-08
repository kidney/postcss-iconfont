const path = require('path');
const Promise = require('bluebird');
const postcss = require('postcss');
const merge = require('merge');
const gulp = require('gulp');
const gulpIconfont = require('gulp-iconfont');

function extractsSVG (css, result, options) {
    let queue = [];

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
            fontName = decl.value;
        });

        // if (!fontName) {
        //     Promise.reject('font-family not found in font-face rule.');
        // }

        queue.push({
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

    return Promise.resolve([options, queue]);
}

function prepare (options, queue) {
    queue.forEach(function (item) {
        options.fontName = item.fontName;
        generateFont({
            srcPath: path.resolve(BASE_PATH, item.srcPath),
            outputPath: OUTPUT_PATH,
            iconFontOptions: options
        });
    });
}

function runGulpIconFont (options) {
    return new Promise(function (resolve, reject) {
        gulp.src([options.srcPath])
            .pipe(gulpIconfont(options.iconFontOptions))
            .on('glyphs', function (glyphs, opts) {
                resolve(glyphs, opts);
            }).on('error', function () {
                reject(glyphs, opts);
            }).pipe(gulp.dest(options.outputPath));
    });
}

function writeStyleRules() {

}

function iconFontPlugin (options) {
    // merge options
    options = merge({
        basePath: process.cwd(),
        outputPath: '',
        formats: ['svg', 'ttf', 'eot', 'woff']
    }, (options || {}));

    const BASE_PATH = options.basePath;
    const OUTPUT_PATH = path.resolve(BASE_PATH, options.outputPath);
    delete options.basePath;
    delete options.outputPath;

    return function (css, result) {
        return extractsSVG(css, result, options)
            .spread(function (opts, queue) {
                return prepare(opts, queue);
            })
            .spread(function (options, queue) {
                return runGulpIconFont(options, queue);
            })
            .spread(function (options, queue) {
                return writeStyleRules(options, queue);
            })
            .catch(function (err) {
                console.error('postcss-iconfont: An error occurred while processing files - ' + err.message);
                console.error(err.stack);
                throw err;
            });
    };
}

module.exports = postcss.plugin('postcss-iconfont', iconFontPlugin);
