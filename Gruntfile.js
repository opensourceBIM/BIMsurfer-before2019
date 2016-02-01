module.exports = function(grunt) {

	grunt
			.initConfig({
				pkg : grunt.file.readJSON("package.json"),
				clean: ["output"],
				concat : {
					js : {
						files : {
							"tmp/bimsurfer.js" : [ "js/*.js", "lib/scenejs/*.js", "lib/jquery-1.10.2/*.js", "api/*.js", "node_modules/bimserverapi/js/*.js" ]
						},
					}
				},
				uglify : {
					dist : {
						files : {
							"output/js/bimsurfer.min.js" : [ "tmp/bimsurfer.js" ]
						}
					}
				},
				cssmin : {
					options : {
						shorthandCompacting : false,
						roundingPrecision : -1
					},
					target : {
						files : {
							"output/css/bimsurfer.min.css" : [ "css/*.css" ]
						}
					}
				},
				copy : {
					main : {
						files : [{
							expand : true,
							src : [ "fonts/**", "img/**" ],
							dest : "output/"
						}, {
							src: ["images/*"],
							dest: "images/"
						}, {
							src: ["*.html"],
							dest: "output/"
						}, {
							src: ["plugin/**"],
							dest: "output/"
						}]
					}
				},
				zip: {
					"using-cwd": {
						cwd: "output",
						src: ["output/**"],
						dest: "output/bimsurfer-%VERSION%.zip"
					}
				},
				"github-release" : {
					options : {
						repository : "opensourceBIM/BIMsurfer",
						auth : {
							user : "%USERNAME%",
							password : "%PASSWORD%"
						},
						release : {
							tag_name : "%VERSION%",
							name : "BIMsurfer %VERSION%",
							body : "Testing...",
							draft : false,
							prerelease : true
						}
					},
					files : {
						src : [ "output/bimsurfer-%VERSION%.zip",
								"output/bimsurfer-bimserver-plugin-%VERSION%.jar" ]
					}
				}
			});

	grunt.loadNpmTasks("grunt-github-releaser");
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-zip");

	grunt.registerTask("default", [ "clean", "concat", "uglify", "cssmin", "copy", "zip", "github-release" ]);
};