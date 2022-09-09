'use strict'

const { parse: basicParse } = require('./syntax-base');
const { createExpressionParser } = require('./expression');

const COMMANDS = {
	'create': { positional: ['variable', 'initialValue'] },
	'temp': { positional: ['variable', 'initialValue'] },
	'set': { positional: ['variable', 'newValue'] },
	
	'if': { positional: ['condition'] },
	'elseif': { positional: ['condition'] },
	'else': { },
	
	'label': { positional: ['name'] },
	'goto': { positional: ['target'] },
	'goto_scene': { positional: ['target'] },
	
	'title': { positional: ['name'] },
	'author': { positional: ['name'] },

	'choice': { },
	'scene_list': { },
	'finish': { }	
};

const COMMAND_PARSERS = Object.fromEntries(Object.entries(COMMANDS).map(([command, config]) => [command, createExpressionParser(config)]));


const completeCommands = (body, errors) => 
	body.map(element => {
		if (element.type !== 'command') {
			return element;
		}
		
		const { type, line, command, param, ...rest } = element;
		
		const commandParser = COMMAND_PARSERS[command.toLowerCase()];
		if (!commandParser) {
			errors.push({ line, message: `Unknown command: "${command}"` })
		}
		
		const expressions = commandParser && commandParser(param);
		const params = expressions && expressions.params;
		
		expressions && (expressions.errors || []).forEach(message => errors.push({ line, message }));
		
		return { type, line, command, params, ...rest };
	});
	

const parse = source => {
	let { type, body, errors } = basicParse(source);	
	
	const completedErrors = [...(errors || [])];
	const completedBody = completeCommands(body, completedErrors);
	
	return { 
		type,
		body: completedBody, 
		errors: completedErrors.length ? completedErrors : undefined 
	};
};


module.exports = { parse };