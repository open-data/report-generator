module.exports = function(grunt) {
    // Load all grunt tasks matching the ['grunt-*', '@*/grunt-*'] patterns
    require('load-grunt-tasks')(grunt);

    function processAppHtml(content) {
        // Remove modules since concatenated in app.js
        content = content.replace(/<\!-- Modules -->(?:.*\s*)*?<\!-- Modules -->/, '');

        // Added the templates inline
        content = content.replace('<!-- Insert: Templates -->', inlineTemplates());

        // Use the minified app
        content = content.replace(/"app.js"/, '"app.min.js"');

        return content;
    }

    function inlineTemplates() {
        var templates = '';

        grunt.file.expand('templates/**/*.html').forEach(function(path) {
            templates += '<script type="text/ng-template" id="' + path + '">\n' + grunt.file.read(path) + '</script>\n';
        });

        return templates;
    }

    grunt.initConfig({
        clean: {
            src: 'dist'
        },

        copy: {
            lib: {
                cwd: 'lib',
                src: [
                    '**/*.*',
                    '!checklist-model/*.*'
                ],
                dest: 'dist/lib',
                expand: true
            },

            app: {
                src: 'index.html',
                dest: 'dist',
                expand: true,
                options: {
                    process: processAppHtml
                }
            }
        },

        concat: {
            js: {
                src: [
                    'app.js',
                    'lib/checklist-model/checklist-model.js',
                    'modules/**/*.js'
                ],
                dest: 'dist/app.js'
            }
        },

        connect: {
            server: {
                options: {
                    port: 8000,
                    base: '.',
                    keepalive: true
                }
            }
        },

        'gh-pages': {
            options: {
                base: 'dist'
            },
            src: '**/*.*'
        },

        jscs: {
            options: {
                config: '.jscsrc'
            },
            src: '<%= jshint.all.src %>'
        },

        jshint: {
            options: {
                reporter: require('jshint-stylish')
            },
            all: {
                src: [
                    '*.js',
                    'modules/**/*.js'
                ]
            }
        },

        uglify: {
            app: {
                cwd: 'dist',
                src: '*.js',
                dest: 'dist',
                ext: '.min.js',
                expand: true
            }
        }
    });

    grunt.registerTask('test', ['jshint', 'jscs']);
    grunt.registerTask('default', ['clean', 'test', 'copy', 'concat', 'uglify']);
    grunt.registerTask('deploy', ['default', 'gh-pages']);
    grunt.registerTask('server', ['connect']);
};
