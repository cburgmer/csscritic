/*global module:false*/
module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg:'<json:package.json>',
        meta:{
            banner:'/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
                ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */',
            bannerAllInOne:'/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
                ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */' +
                '\n/* Integrated dependencies:\n' +
                ' * URI.js (MIT License/GPL v3),\n' +
                ' * cssParser.js (MPL 1.1/GPL 2.0/LGPL 2.1),\n' +
                ' * htmlparser.js,\n' +
                ' * imagediff.js (MIT License),\n' +
                ' * rasterizeHTML.js (MIT License) */'
        },
        lint:{
            src:'<%= pkg.name %>.js',
            grunt:'grunt.js',
            test:'test/*Spec.js'
        },
        jasmine:{
            src:['components/rasterizeHTML.js/lib/*.js', 'components/rasterizeHTML.js/rasterizeHTML.js', 'lib/*.js', '<%= pkg.name %>.js', 'basichtmlreporter.js'],
            specs:'test/*Spec.js',
            helpers:['test/helpers.js', 'test/gruntpath.js', 'test/lib/*.js'],
            timeout:10000,
            fixturesPath:'./fixtures/'
        },
        concat:{
            dist:{
                src:['<banner:meta.banner>', '<file_strip_banner:<%= pkg.name %>.js>', 'basichtmlreporter.js'],
                dest:'dist/<%= pkg.name %>.js'
            }
        },
        min:{
            dist:{
                src:['<banner:meta.banner>', '<config:concat.dist.dest>'],
                dest:'dist/<%= pkg.name %>.min.js'
            },
            allinone: {
                src:['<banner:meta.bannerAllInOne>', '<config:concat.dist.dest>', 'components/rasterizeHTML.js/lib/*.js', 'components/rasterizeHTML.js/rasterizeHTML.js', 'lib/*.js'],
                dest:'dist/<%= pkg.name %>.allinone.js'
            }
        },
        cssmin:{
            dist:{
                src:['basichtmlreporter.css'],
                dest:'dist/<%= pkg.name %>.min.css'
            }
        },
        csslint: {
            basichtmlreporter: {
                src: '<%= pkg.name %>.css',
                rules:{
                    "ids":false,
                    "adjoining-classes":false,
                    "box-model":false
                }
            }
        },
        watch:{
            files:'<config:lint.files>',
            tasks:'lint jasmine'
        },
        jshint:{
            options:{
                curly:true,
                eqeqeq:true,
                immed:true,
                latedef:true,
                newcap:true,
                noarg:true,
                undef:true,
                unused:true,
                eqnull:true,
                trailing: true,
                browser:true
            },
            src:{
                globals:{
                    rasterizeHTML:true,
                    imagediff:true
                }
            },
            test:{
                globals:{
                    "$":true,
                    jasmine:true,
                    describe:true,
                    it:true,
                    beforeEach:true,
                    afterEach:true,
                    waitsFor:true,
                    runs:true,
                    expect:true,
                    spyOn:true,
                    rasterizeHTML:true,
                    imagediff:true,
                    csscritic:true,
                    ifNotInWebkitIt:true,
                    csscriticTestPath:true
                }
            }
        },
        uglify:{}
    });

    grunt.loadNpmTasks('grunt-jasmine-runner');
    grunt.loadNpmTasks('grunt-css');

    // Default task.
    grunt.registerTask('default', 'lint csslint jasmine concat min cssmin');

};
