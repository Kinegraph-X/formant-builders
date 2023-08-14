let mongoose = require('mongoose');


module.exports = function (grunt) {
	
	/**
	*
	* Gruntfile oriented to js bundles creation to which we could want to associate a spip dependencies list and inherent deployment logic
	* command : grunt build-debug --verbose --bundle MP4Parser --config-debug --stack
	*
	*/
//	console.log(grunt.cli.options, process.argv);

	var rootPath = 'plugins_spip/', gruntFilesPath = '_Grunt_files/', basePath, currentBundle, currentLib, currentServer;
	
	currentBundle = grunt.cli.options.bundle;
	currentLib = grunt.cli.options.lib;
	// server creation is buggy : lodash error ("maximum call stack depth exceeded")
	currentServer = grunt.cli.options.server;
	if ((typeof currentBundle === 'undefined' || !currentBundle)
			&& (typeof currentLib === 'undefined' || !currentLib)
			&& (typeof currentServer === 'undefined' || !currentServer)
			&& grunt.cli.tasks[0] !== 'bundleCSSFonts'
			&& grunt.cli.tasks[0] !== 'roughDBupdate') {
		console.error('Error : no bundle name to build. ', 'usage : --bundle projectName OR --lib projectName OR --server serverName AND call task "newSomething" or "deploySomething" or "watch"')
		return;
	}
	
	if (grunt.cli.tasks[0] === 'bundleCSSFonts') {
		basePath = 'coreBuildTools';
		grunt.registerTask('bundleCSSFonts', 'This will bundle the filenames in spip_baseApp/fontlib to a css file', function() {
			var done = this.async();
			require(basePath)(grunt, done);
		});
//		grunt.task.run('bundleCSSFonts');
		return;
	}
	else if (grunt.cli.tasks[0] === 'roughDBupdate') {
		basePath = 'coreBuildTools/MongoDBRoughUpdater';
		grunt.registerTask('roughDBupdate', 'This will update the themed_components DB, adding the needed & hard-coded prop', function() {
			var done = this.async();
			require(basePath)(grunt, done);
		});
		return;
	}
	else if (grunt.cli.tasks[0] === 'newStarter') {
		basePath = rootPath + gruntFilesPath + '_Starters/';
		require("grunt-load-gruntfile")(grunt,{requireResolution: true});
		grunt.loadGruntfile(basePath);
		return;
	}
	else if (grunt.cli.tasks[0] === 'newLib') {
		basePath = rootPath + gruntFilesPath + '_Lib/';
		require("grunt-load-gruntfile")(grunt,{requireResolution: true});
		grunt.loadGruntfile(basePath);
		return;
	}
	else if (grunt.cli.tasks[0] === 'newCoreComponent') {
		basePath = rootPath + gruntFilesPath + '_coreComponent/';
		require("grunt-load-gruntfile")(grunt,{requireResolution: true});
		grunt.loadGruntfile(basePath);
		return;
	}
	else if (grunt.cli.tasks[0] === 'newPackageComponent') {
		basePath = rootPath + gruntFilesPath + '_packageComponent/';
		require("grunt-load-gruntfile")(grunt,{requireResolution: true});
		grunt.loadGruntfile(basePath);
		return;
	}
	else if (grunt.cli.tasks[0] === 'newBundle') {
		basePath = rootPath + gruntFilesPath + '_Bundles/';
		require("grunt-load-gruntfile")(grunt,{requireResolution: true});
		grunt.loadGruntfile(basePath);
		return;
	}
	else if (grunt.cli.tasks[0] === 'newServer') {
		basePath = 'test_servers/' + gruntFilesPath;
		require("grunt-load-gruntfile")(grunt,{requireResolution: true});
		grunt.loadGruntfile(basePath);
		return;
	}
	else
		basePath = rootPath + '_Bundles/';
		
	
	// THIS IS commmented out as the CSSify transform makes its own connection. Then calling "watch()" below shall fail on the first iteration of the watch task.
	// TODO: Fix that. Is there a workaround ? Which file should initiate the connection to the DB ?
	// 		(seems it fails constantly when there is no style to apply from the DB...)
	mongoose.connect(
		'mongodb://localhost:27017/themed_components',
		{
			useCreateIndex: true,
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
			serverSelectionTimeoutMS: 3000
		}
	).catch(function(err) {
		console.error('moongoose connection caught error');
	});
	mongoose.connection.once('open', function() {
		console.log('connected to db');
	})
	
	var bundleConfig = grunt.file.readJSON(currentBundle + '.json');
	if (!bundleConfig) {
		console.error('Error : no bundle content given. ', 'Please create the file "' + currentBundle + '.json"')
		return;
	}
    var path = require('path');
	var folderArray = bundleConfig.content;
	
	var configPath = [], browserifyPath = [];
	folderArray.forEach(function(val, key) {
		configPath.push(path.join(process.cwd(), rootPath + val));
		browserifyPath.push(rootPath + val);
	});
	
	var pkg = grunt.file.readJSON('package.json');
	pkg.main = path.join(process.cwd(), basePath + currentBundle + '/index.js');
 
    require('load-grunt-config')(grunt, {
        // path to config.js & task.js files, defaults to grunt dir
        configPath: configPath,
		overridePath: path.join(process.cwd(), basePath + currentBundle + '/grunt-config-' + currentBundle),
		init : true,
		data : {
			rootPath : rootPath,
			basePath : basePath,
			currentProject : currentBundle,
			pathToProject : basePath + currentBundle + '/',
			compilerRoot : '_Spip_as_A_Compiler/',
			compilerCommand : 'spip.php',
			localDeployPath : bundleConfig.localDeployRoot + 'plugins/',
			browserifyPath : browserifyPath,
			UIpackage : bundleConfig.UIpackage || ['minimal'],
			ressourcePath : bundleConfig.ressourcePath
		},
		postProcess : function (config) {
			config.package = pkg;
			return config;
		}
	});
	
	grunt.registerTask('default',   ['echo']);
	grunt.registerTask('build-debug',   ['execute:debug', 'browserify:debug', 'exorcise:debug', 'copy:localRelease']);
	grunt.registerTask('build-localRelease',   ['execute:debug', 'browserify:release', 'terser:release', 'copy:localRelease']);
	

	mongoose.connection.watch().on('change', function() {
		console.log('>>>>>>>>>>>>>>>>> change to db <<<<<<<<<<<<<<<<<<<<<');
		grunt.file.delete(basePath + currentBundle + '/js/' + currentBundle + '.debug.js');
	});
};