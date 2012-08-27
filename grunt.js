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
                ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
        },
        lint:{
            src:'<%= pkg.name %>.js',
            grunt:'grunt.js',
            test:'test/*Spec.js'
        },
        jasmine:{
            all:['test/SpecRunner.html']
        },
        concat:{
            dist:{
                src:['<banner:meta.banner>', '<file_strip_banner:<%= pkg.name %>.js>'],
                dest:'dist/<%= pkg.name %>.js'
            }
        },
        min:{
            dist:{
                src:['<banner:meta.banner>', '<config:concat.dist.dest>'],
                dest:'dist/<%= pkg.name %>.min.js'
            }
        },
        cssmin:{
            dist:{
                src:['<%= pkg.name %>.css'],
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
                    ifNotInWebkitIt:true
                }
            }
        },
        uglify:{}
    });

    grunt.loadNpmTasks('grunt-jasmine-task');
    grunt.loadNpmTasks('grunt-css');

    // Default task.
    grunt.registerTask('default', 'lint csslint jasmine concat min cssmin');

};
