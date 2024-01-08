// Package imports
const {src, dest, series, parallel, task, watch} = require('gulp');
const path = require('path');
const fs = require('fs');
const sass = require('sass');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const ESLintPlugin = require('eslint-webpack-plugin');

// If NODE_ENV is undefined or set to anything other than 'development',
// we run webpack in 'production' mode and also pass the string
// 'production' to the javascript via the DefinePlugin definition
// below
let productionMode = true;
if (process.env.NODE_ENV) {
    if (process.env.NODE_ENV == 'development') {
        productionMode = false;
    }
}

// Configuration
const settings = {
    delayBetweenWatchTriggers: 500,

    sass: {
        // Output directory
        outputDirectory: './css',

        // This is stripped from the paths in "sourceFiles" to produce the output filenames
        sourceRootPath: 'css/',

        // Paths to watch for triggering recompilation
        watch: [
            'css/**/*.scss',
        ],

        // SASS source files
        sourceFiles: [
            'css/styles.scss',
        ],
    },

    javascript: {
        // Output directory
        outputDirectory: './js',

        // This is stripped from the paths in "sourceFiles" to produce the output filenames
        sourceRootPath: 'js/',

        // Paths to watch for triggering recompilation
        watch: [
            'js/**/*.js',
            '!js/**/*.min.js',
        ],

        // Javascript source files
        sourceFiles: [
            'js/main.js',
        ],
    },
};

// Utility functions
const cleanPathSeparators = function(filePath) {
    return filePath.replace(/\\/g, '/');
};

const pathIsInArray = function(filePath, array) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] == filePath)
            return true;
    }

    return false;
};

const swallowError = function(_) {
    this.emit('end')
};

// 'source' may be a single path string or an array of paths
function minifySass(source, cb = null) {
    if (source.length <= 0) {
        if (cb)
            cb();

        return;
    }

    console.log(`Processing ${source.length} SASS file${source.length > 1 ? 's' : ""}`);

    const promises = [];
    for (let i = 0; i < source.length; i++) {
        const fileName = source[i];
        let outputName = fileName;

        // Remove "src/client/css/" and ".js" from the file path to produce the output file name
        if (outputName.indexOf(settings.sass.sourceRootPath) == 0)
            outputName = outputName.substr(settings.sass.sourceRootPath.length);

        outputName = path.join(settings.sass.outputDirectory, outputName);
        outputName = path.parse(outputName);
        outputName = path.join(outputName.dir, outputName.name + '.min.css');

        const promise = new Promise(function(resolve, reject) {
            try {
                // Compile the SASS
                const compileResult = sass.compile(
                    fileName,
                    {
                        style: 'compressed',
                        sourceMap: !productionMode,
                    },
                );

                // Save compiled CSS
                const outputDirectory = path.dirname(outputName);
                if (!fs.existsSync(outputDirectory)) {
                    fs.mkdirSync(
                        outputDirectory,
                        {
                            recursive: true
                        }
                    );
                }

                let outputCss = compileResult.css;
                if (compileResult.sourceMap) {
                    outputSourceMapName = outputName.replace(/\.css$/, '.css.map');
                    outputCss += `\n/*# sourceMappingURL=${
                        outputSourceMapName
                            .replaceAll('\\', '/')
                            .replace(/^css\//, '')
                    } */`;
                    
                    fs.writeFileSync(
                        outputSourceMapName,
                        JSON.stringify(compileResult.sourceMap),
                    );
                }

                fs.writeFileSync(
                    outputName,
                    outputCss,
                );

                // Done
                resolve();
            } catch(error) {
                reject(error);
            }
        });

        promises.push(promise);
    }

    Promise
        .all(promises)
        .then(function() {
            if (cb)
                cb();
        });
}

// 'source' may be a single path string or an array of paths
async function minifyJavascript(source, cb = null) {
    console.log(`Processing ${source.length} Javascript file${source.length > 1 ? 's' : ""}`);

    // Assemble an entry object for webpack
    let entry = {};
    for (let i = 0; i < source.length; i++) {
        let filePath = source[i],
            entryName = filePath;

        // Remove "src/client/js/" and ".js" from the file path to produce the webpack entry name
        if (entryName.indexOf(settings.javascript.sourceRootPath) == 0)
            entryName = entryName.substr(settings.javascript.sourceRootPath.length);

        let extIndex = entryName.indexOf('.js');
        if (extIndex > 0)
            entryName = entryName.substr(0, extIndex);

        entry[entryName] = `./${filePath}`;
    }

    // Run webpack, using babel-loader to transpile all the files
    // Note: we're using the "entry" option instead of Gulp src here
    // in order to name the output files things other than the default
    // "main" entry point
    await webpackStream(
        {
            mode: productionMode ? 'production' : 'development',

            // This enables the "SourceMapDevToolPlugin" plugin below
            //devtool: 'source-map',
            devtool: false,

            entry: entry,
            output: {
                filename: '[name].min.js'
            },

            performance: {
                // Change recommended max entry point size - this defaults
                // to 250000, which we just slightly exceed. Would need to
                // implement code splitting to address this
                maxAssetSize: 400000,
                maxEntrypointSize: 400000,
            },

            module: {
                rules: [
                    {
                        test: /\.js?$/,
                        exclude: /(node_modules)/,
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                // '@babel/react'
                            ]
                        }
                    }
                ]
            },
            plugins: [
                // Note: this is for compiling javascript within "src/client/js"
                // Only apply ESLint rules for files so that we're not dogmatic
                // about how the actual banner content is developed
                new ESLintPlugin({
                    overrideConfigFile: './js/.eslintrc.js',
                    useEslintrc: false,
                }),

                // This exposes "envAndCompileMode" to our compiled javascript
                new webpack.DefinePlugin({
                    'env': JSON.stringify(productionMode ? 'production' : 'development')
                }),

                // This allows for additional configuration around how source map
                // files are created; namely, making sure the minified javascript
                // contains the correct "sourceMappingURL" references in them
                new webpack.SourceMapDevToolPlugin({
                    filename: '[name].min.js.map'
                })
            ]
        },
        webpack)

        .pipe(
            dest(settings.javascript.outputDirectory)
        )

        .on('end', function() {
            if (cb)
                cb();
        });
}

exports.watch = () => {
    let lastWatchTriggerTime = (new Date()).getTime();

    // SASS
    watch(
        settings.sass.watch,
        {
            read: false
        })

        // Prevent errors from halting the watch process
        .on('error', swallowError)

        // Prevent TFS checkins from triggering the task
        .on('all', function(event, filePath) {
            // Prevent watch from triggering multiple times simultaneously
            const triggerTime = (new Date()).getTime();
            if (triggerTime - lastWatchTriggerTime < settings.delayBetweenWatchTriggers) {
                return;
            }

            lastWatchTriggerTime = triggerTime;

            // Clean up the file path
            filePath = cleanPathSeparators(filePath);

            // Check if the path is one of the items in the sourceFiles array
            let source = settings.sass.sourceFiles;
            if (pathIsInArray(filePath, source)) {
                // Path is in our array - only minify this file
                source = [filePath];
            }

            task('minifySass', function(cb) {
                minifySass(source, cb);
            });

            series('minifySass')();
        });

    // Javascript
    watch(
        settings.javascript.watch,
        {
            read: false
        })

        // Prevent errors from halting the watch process
        .on('error', swallowError)

        // Prevent TFS checkins from triggering the task
        .on('all', function(event, filePath) {
            // Prevent watch from triggering multiple times simultaneously
            const triggerTime = (new Date()).getTime();
            if (triggerTime - lastWatchTriggerTime < settings.delayBetweenWatchTriggers) {
                return;
            }

            lastWatchTriggerTime = triggerTime;

            // Clean up the file path
            filePath = cleanPathSeparators(filePath);

            // Check if the path is one of the items in the sourceFiles array
            let source = settings.javascript.sourceFiles;
            if (pathIsInArray(filePath, source)) {
                // Path is in our array - only minify this file
                source = [filePath];
            }

            task('minifyJavascript', function(cb) {
                minifyJavascript(source, cb);
            });

            series('minifyJavascript')();
        });
};

exports.minifySass = function(cb) {
    minifySass(
        settings.sass.sourceFiles,
        cb);
};

exports.minifyJavascript = function(cb) {
    minifyJavascript(
        settings.javascript.sourceFiles,
        cb);
};

exports.minifyEverything = function(cb) {
    task('minifySass', exports.minifySass);
    task('minifyJavascript', exports.minifyJavascript);

    parallel(
        'minifySass',
        'minifyJavascript')(cb);
};

exports.default = exports.minifyEverything;
