/*global module:false*/
module.exports = function (grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            deps: ['build/dependencies/*.js'],
            dist: ['build/*.js'],
            all: ['build', 'test/ui/*.html.json', 'example/*.html.json']
        },
        jasmine: {
            src: 'csscritic.js',
            options: {
                specs: ['test/specs/shared/', 'test/specs/*.js', 'test/specs/browser/'],
                helpers: [
                    'test/helpers.js',
                    'node_modules/jquery/dist/jquery.js',
                    'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
                    'test/gruntpath.js'
                ],
                fixturesPath: './fixtures/'
            }
        },
        shell: {
            runPhantomTests: {
                command: 'phantomjs test/run-phantomjs-tests.js'
            }
        },
        concat: {
            phantomjs: {
                options: {
                    banner: '/*! PhantomJS regression runner for <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                        '* <%= pkg.homepage %>\n' +
                        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>, Copyright (c) 2012 ThoughtWorks, Inc.;' +
                        ' Licensed <%= pkg.license %> */' +
                        '\n/* Integrated dependencies:\n' +
                        ' * jsSHA.js (BSD License),\n' +
                        ' * ayepromise (BSD License & WTFPL),\n' +
                        ' * imagediff.js (MIT License),\n' +
                        ' * url (MIT License),\n' +
                        ' * CSSOM (MIT License),\n' +
                        ' * inlineresources (MIT License) */\n\n'
                },
                src: [
                    'node_modules/jssha/src/sha.js',
                    'node_modules/imagediff/imagediff.js',
                    'node_modules/ayepromise/ayepromise.js',
                    'build/dependencies/inlineresources.js',
                    'src/boot/scope.js',
                    'src/cli/*.js',
                    'src/*.js',
                    'src/boot/cli.js'
                ],
                dest: 'dist/<%= pkg.name %>-phantom.js'
            },
            one: {
                src: [
                    'src/boot/scope.js',
                    'src/*.js',
                    'src/browser/*.js',
                    'src/boot/browser.js',
                ],
                dest: 'build/<%= pkg.name %>.concat.js'
            }
        },
        umd: {
            all: {
                src: 'build/<%= pkg.name %>.concat.js',
                dest: 'build/<%= pkg.name %>.umd.js',
                objectToExport: 'csscritic',
                indent: '    ',
                deps: {
                    default: ['ayepromise', 'imagediff', 'rasterizeHTML'],
                    cjs: ['ayepromise', 'imagediff', 'rasterizehtml'],
                    amd: ['ayepromise', 'imagediff', 'rasterizehtml']

                }
            }
        },
        browserify: {
            inlineresources: {
                src: 'node_modules/inlineresources/src/inline.js',
                dest: 'build/dependencies/inlineresources.js',
                options: {
                    bundleOptions: {
                        'standalone': 'inlineresources'
                    }
                }
            },
            allinone: {
                src: 'build/<%= pkg.name %>.umd.js',
                dest: 'build/<%= pkg.name %>.allinone.js',
                options: {
                    standalone: 'csscritic',
                    // Work around for https://github.com/HumbleSoftware/js-imagediff/issues/29
                    /* Does not work due to https://github.com/HumbleSoftware/js-imagediff/pull/28 */
                    exclude: ['node_modules/imagediff/node_modules/canvas/lib/canvas.js']
                    // We'd prefer "exclude: ['canvas']" but https://github.com/jmreidy/grunt-browserify/issues/187
                }
            }
        },
        uglify: {
            allinone: {
                options: {
                    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                        '* <%= pkg.homepage %>\n' +
                        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>, Copyright (c) 2012 ThoughtWorks, Inc.;' +
                        ' Licensed <%= pkg.license %> */' +
                        '\n/* Integrated dependencies:\n' +
                        ' * imagediff.js (MIT License),\n' +
                        ' * ayepromise (BSD License & WTFPL),\n' +
                        ' * url (MIT License),\n' +
                        ' * CSSOM (MIT License),\n' +
                        ' * xmlserializer (MIT License),\n' +
                        // not yet ' * css-font-face-src (BSD License),\n' +
                        ' * inlineresources (MIT License),\n' +
                        ' * rasterizeHTML.js (MIT License) */\n'
                },
                files: {
                    'dist/<%= pkg.name %>.allinone.js': ['build/<%= pkg.name %>.allinone.js']
                }
            }
        },
        cssmin: {
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.css': ['src/browser/*.css']
                }
            }
        },
        csslint: {
            basichtmlreporter: {
                src: 'src/**/*.css',
                options: {
                    "ids": false,
                    "adjoining-classes": false,
                    "box-model": false,
                    "box-sizing": false
                }
            }
        },
        watch: {
            files: [
                '*.js',
                'src/**/*.js',
                'test/**/*.js'
            ],
            tasks: ['test']
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                undef: true,
                unused: true,
                eqnull: true,
                trailing: true,
                browser: true,
                sub: true,
                strict: true
            },
            grunt: {
                src: 'Gruntfile.js',
            },
            src: {
                options: {
                    globals: {
                        rasterizeHTML: true,
                        inlineresources: true,
                        jsSHA: true,
                        imagediff: true,
                        ayepromise: true,
                        phantom: true,
                        console: true,
                        require: true,
                        csscriticLib: true,
                        csscritic: true
                    },
                    exported: ['csscriticLib'],
                    ignores: ['src/cli/phantomjsbind.js']
                },
                src: 'src/**/*.js',
            },
            test: {
                options: {
                    globals: {
                        "$": true,
                        jasmine: true,
                        describe: true,
                        it: true,
                        beforeEach: true,
                        afterEach: true,
                        waitsFor: true,
                        runs: true,
                        expect: true,
                        spyOn: true,
                        setFixtures: true,
                        readFixtures: true,
                        rasterizeHTML: true,
                        imagediff: true,
                        imagediffForJasmine2: true,
                        csscriticLib: true,
                        ifNotInWebkitIt: true,
                        safeLog: true,
                        csscriticTestPath: true,
                        csscriticTestHelper: true,
                        loadStoragePluginSpecs: true,
                        CanvasRenderingContext2D: true,
                        ayepromise: true
                    },
                    exported: ['loadStoragePluginSpecs']
                },
                src: [
                    'test/specs/*.js',
                    'test/specs/browser/',
                    'test/specs/shared/',
                    'test/ui/*.js'
                ]
            },
            phantomjsTests: {
                options: {
                    globalstrict: true,
                    globals: {
                        phantom: true,
                        require: true,
                        localserver: true,
                        "$": true,
                        jasmine: true,
                        describe: true,
                        it: true,
                        beforeEach: true,
                        afterEach: true,
                        waitsFor: true,
                        waits: true,
                        runs: true,
                        expect: true,
                        spyOn: true,
                        inlineresources: true,
                        jsSHA: true,
                        imagediff: true,
                        imagediffForJasmine2: true,
                        csscriticLib: true,
                        safeLog: true,
                        csscriticTestPath: true,
                        csscriticTestHelper: true,
                        loadStoragePluginSpecs: true,
                        jasmineRequire: true,
                        executeJasmine: true
                    }
                },
                src: [
                    'test/*.js',
                    'test/specs/cli/',
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-umd');

    grunt.registerTask('dependencies', [
        'clean:deps',
        'browserify:inlineresources',
    ]);

    grunt.registerTask('test', [
        'jshint',
        'csslint',
        'jasmine',
        'shell:runPhantomTests'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'concat',
        'umd',
        'browserify:allinone',
        'uglify',
        'cssmin'
    ]);

    grunt.registerTask('default', [
        'dependencies',
        'test',
        'build'
    ]);

};
