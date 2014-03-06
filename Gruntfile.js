/*global module:false*/
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jasmine: {
            src: [
                'bower_components/rasterizeHTML.js/dist/rasterizeHTML.allinone.js',
                'bower_components/js-imagediff/imagediff.js',
                'src/utils.js',
                'src/phantomjsrenderer.js',
                'src/browserrenderer.js',
                'src/domstorage.js',
                'src/<%= pkg.name %>.js',
                'src/basichtmlreporter.js',
            ],
            options: {
                specs: ['test/specsShared/*', 'test/specs/*'],
                helpers: [
                    'test/helpers.js',
                    'bower_components/jquery/jquery.js',
                    'bower_components/jasmine-jquery/lib/jasmine-jquery.js',
                    'test/gruntpath.js'
                ],
                fixturesPath: './fixtures/'
            }
        },
        shell: {
            runPhantomTests: {
                options: {
                    stdout: true,
                    failOnError: true
                },
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
                        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */' +
                        '\n/* Integrated dependencies:\n' +
                        ' * jsSHA.js (BSD License),\n' +
                        ' * url (MIT License),\n' +
                        ' * CSSOM (MIT License),\n' +
                        ' * xmlserializer (MIT License),\n' +
                        ' * ayepromise (BSD License & WTFPL),\n' +
                        ' * imagediff.js (MIT License),\n' +
                        ' * rasterizeHTML.js (MIT License) */\n\n'
                },
                src: ['src/phantomjsbind.js', 'src/utils.js', 'bower_components/jssha/src/sha256.js', 'bower_components/rasterizeHTML.js/dist/rasterizeHTML.allinone.js', 'bower_components/js-imagediff/imagediff.js', 'src/phantomjsrenderer.js', 'src/filestorage.js', 'src/<%= pkg.name %>.js', 'src/signoffreporter.js', 'src/terminalreporter.js', 'src/htmlfilereporter.js', 'src/phantomjs_runner.js'],
                dest: 'dist/<%= pkg.name %>-phantom.js'
            },
            server: {
                src: ['bower_components/rasterizeHTML.js/dist/rasterizeHTML.allinone.js', 'src/phantomjs_render_backend.js'],
                dest: 'dist/<%= pkg.name %>-server.js'
            }
        },
        uglify: {
            allinone: {
                options: {
                    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                        '* <%= pkg.homepage %>\n' +
                        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>, Copyright (c) 2012 ThoughtWorks, Inc.;' +
                        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */' +
                        '\n/* Integrated dependencies:\n' +
                        ' * url (MIT License),\n' +
                        ' * CSSOM (MIT License),\n' +
                        ' * xmlserializer (MIT License),\n' +
                        ' * ayepromise (BSD License & WTFPL),\n' +
                        ' * imagediff.js (MIT License),\n' +
                        ' * rasterizeHTML.js (MIT License) */\n'
                },
                files: {
                    'dist/<%= pkg.name %>.allinone.js': [
                        'bower_components/rasterizeHTML.js/dist/rasterizeHTML.allinone.js',
                        'bower_components/js-imagediff/imagediff.js',
                        'src/utils.js',
                        'src/browserrenderer.js',
                        'src/domstorage.js',
                        'src/<%= pkg.name %>.js',
                        'src/basichtmlreporter.js'
                    ]
                }
            }
        },
        cssmin: {
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.css': ['src/basichtmlreporter.css']
                }
            }
        },
        csslint: {
            basichtmlreporter: {
                src: 'src/basichtmlreporter.css',
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
                'src/*.js',
                'test/*.js'
            ],
            tasks: [
                'jshint',
                'jasmine'
            ]
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
                sub: true
            },
            grunt: {
                src: 'Gruntfile.js',
            },
            src: {
                options: {
                    globals: {
                        rasterizeHTML: true,
                        rasterizeHTMLInline: true,
                        jsSHA: true,
                        imagediff: true,
                        phantom: true,
                        console: true,
                        require: true,
                        csscritic: true
                    },
                    ignores: ['src/phantomjsbind.js']
                },
                src: 'src/*.js',
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
                        csscritic: true,
                        ifNotInWebkitIt: true,
                        safeLog: true,
                        csscriticTestPath: true,
                        csscriticTestHelper: true,
                        loadStoragePluginSpecs: true,
                        CanvasRenderingContext2D: true
                    }
                },
                src: [
                    'test/specs/*.js',
                    'test/specsShared/*.js',
                    'test/gruntpath.js',
                    'test/ui/*.js'
                ]
            },
            phantomjsTests: {
                options: {
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
                        imagediff: true,
                        csscritic: true,
                        safeLog: true,
                        csscriticTestPath: true,
                        csscriticTestHelper: true,
                        loadStoragePluginSpecs: true
                    }
                },
                src: [
                    'test/helpers.js',
                    'test/run-*.js',
                    'test/specsPhantom/*.js',
                    'test/phantomjs-regressionrunner.js'
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
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('test', [
        'jshint',
        'csslint',
        'jasmine',
        'shell:runPhantomTests'
    ]);

    grunt.registerTask('default', [
        'test',
        'concat',
        'uglify',
        'cssmin'
    ]);

};
