module.exports = function(grunt) {
    // Load all grunt tasks matching the ['grunt-*', '@*/grunt-*'] patterns
    require('load-grunt-tasks')(grunt);

    function processAppHtml(content) {
        // Remove modules since concatenated in app.js
        content = content.replace(/<\!-- Modules -->(?:.*\s*)*?<\!-- Modules -->/, '');

        // Added the templates inline
        content = content.replace('<!-- Insert: Templates -->', inlineTemplates());

        // Use the minified app and config
        content = content.replace(/"app.js"/, '"app.min.js"');
        content = content.replace(/"config\/config.js"/, '"config/config.min.js"');

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
                    base: 'dist',
                    keepalive: true
                }
            }
        },

        'gh-pages': {
            options: {
                base: 'dist'
            },
            'gh-pages': {
                src: '**/*.*'
            },
            internal: {
                options: {
                    branch: 'gh-pages-internal'
                },
                src: '**/*.*'
            }
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

        replace: {
            external: {
                options: {
                    patterns: [{
                        json: grunt.file.readJSON('./config/environments/external.json')
                    }]
                },
                src: 'config/config.js',
                dest: 'dist',
                expand: true
            },
            internal: {
                options: {
                    patterns: [{
                        json: grunt.file.readJSON('./config/environments/internal.json')
                    }]
                },
                src: 'config/config.js',
                dest: 'dist',
                expand: true
            }
        },

        uglify: {
            options: {
                sourceMap: true
            },
            app: {
                cwd: 'dist',
                src: [
                    '*.js',
                    'config/*.js'
                ],
                dest: 'dist',
                ext: '.min.js',
                expand: true
            }
        }
    });

    grunt.registerTask('test', ['jshint', 'jscs']);
    grunt.registerTask('default', ['external']);
    grunt.registerTask('external', ['clean', 'test', 'copy', 'concat', 'replace:external', 'uglify']);
    grunt.registerTask('internal', ['clean', 'test', 'copy', 'concat', 'replace:internal', 'uglify']);
    grunt.registerTask('deploy', ['external', 'gh-pages:gh-pages']);
    grunt.registerTask('deploy-internal', ['internal', 'gh-pages:internal']);
    grunt.registerTask('server', ['connect']);
};
