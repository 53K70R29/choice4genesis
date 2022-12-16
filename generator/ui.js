'use strict';

const { existsSync, lstatSync, readdir } = require('fs');
const { normalize } = require('path');
const { textSync } = require('figlet');
const chalk = require('chalk');

const menu = require('node-menu');

const pjson = require('./../package.json');
const { getProjectsFolder, isProjectsFolderPresent } = require('./project');

// TODO: Use async file access
const showMenu = (commandLine, executeCommands) => {
	
	if (!isProjectsFolderPresent(commandLine)) {
		return { errors: [{ message: 'Directory does not exist: ' + projectsFolder }] };
	}
	
	const projectsFolder = getProjectsFolder(commandLine);
	
	readdir(projectsFolder, (err, files) => {
		if (err) {
			console.error('Error while listing projects: ' + err);
			return;
		}
		
		menu.customHeader(function() {
				console.log(chalk.blue(textSync(pjson.name, { font: 'Rectangles' })));
				console.log(`v${pjson.version}`);
				console.log('');
			})
			.addDelimiter('-', 40, 'Which project do you want to compile?');
			
		files
			.filter(fileName => lstatSync(`${projectsFolder}/${fileName}`).isDirectory())
			.forEach(projectName => menu.addItem(projectName, () => {
				commandLine.project = projectName;
				return executeCommands();
			}));
			
		menu.start();
	});
};

module.exports = { showMenu }; 