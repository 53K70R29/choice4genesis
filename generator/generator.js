'use strict'

const { compact } = require('lodash');
const { parse } = require('../parser/syntax-full');


const buildEntityError = ({ line }, message) => ({ line, message });

const getStringConstant = (entity, parameter, context, name) => {
	if (!parameter) {
		context.errors.push(buildEntityError(entity, name + ' was not informed.'));
		return null;
	}
	if (parameter[0] !== 'StringConstant') {
		context.errors.push(buildEntityError(entity, name + ' must be a string constant.'));
	}
	return parameter[1];
}

const getNumber = (entity, parameter, context, name) => {
	if (!parameter) {
		context.errors.push(buildEntityError(entity, name + ' was not informed.'));
		return null;
	}
	if (parameter[0] !== 'NumberConstant') {
		context.errors.push(buildEntityError(entity, name + ' must be a number.'));
	}
	return parameter[1];
}

const indent = (...params) =>
	params
	.map(o => 
		!o ? '' : 
		o.split() ? o.split('\n') : 
		o.flat ? o.flat() : 
		`// Unknown value of type ${typeof o}: ${o}`)
	.flat()
	.map(s => '\t' + s)
	.join('\n');
	
const generateImageCommand = (functionName, entity, context) => {
	const imageFileName = getStringConstant(entity, entity.params.positional.fileName, context, 'Image filename');
	const imageVariable = 'img_' + imageFileName.trim().replace(/\.png$/, '').replace(/\W+/g, '_');				
	context.res.gfx.push(`IMAGE ${imageVariable} "../project/${imageFileName}" APLIB`);
	
	const position = entity.params.named && entity.params.named.at;
	const positionSrc = position ? `VN_imageAt(${position.x[1]}, ${position.y[1]});` + '\n' : '';
	
	return positionSrc + `${functionName}(&${imageVariable});`;
};


const generateFromSource = (sourceName, context) => {
	const source = context.fileSystem.readSource(sourceName);
	const ast = parse(source);
	if (ast.errors) {
		return { errors: ast.errors };
	}

	const generated = compact(ast.body.map(entity => {
		if (entity.type === 'text') {
			return `VN_text("${entity.text}");`
		}
		if (entity.type === 'command') {
			if (entity.command === 'background') {
				return generateImageCommand('VN_background', entity, context);
			}
			
			if (entity.command === 'image') {
				return generateImageCommand('VN_image', entity, context);
			}
			
			if (entity.command === 'music') {
				const musicFileName = getStringConstant(entity, entity.params.positional.fileName, context, 'Music filename');
				const musicVariable = 'xgm_' + musicFileName.trim().replace(/\..gm$/, '').replace(/\W+/g, '_');
				context.res.music.push(`XGM ${musicVariable} "../project/${musicFileName}" APLIB`);
				return `VN_music(${musicVariable});`;
			}

			if (entity.command === 'wait') {
				const duration = getNumber(entity, entity.params.positional.duration, context, 'Wait duration');
				return `VN_wait(${duration});`;
			}
		}
	})).join('\n');
	
	if (context.errors && context.errors.length) {
		return { errors: context.errors };
	}
	
	const functionName = `VS_${sourceName}`;
			
	const generatedFunction = [
		`void *${functionName}() {`,
		indent(
			generated,
			'VN_flushText();',
			`return ${functionName};`
		),
		'}'
	].join('\n');
	
	return {
		sources: {
			'generated_scripts.c': '#include "vn_engine.h"\n' + generatedFunction
		},
		
		resources: {
			'gfx.res': context.res.gfx.join('\n'),
			'music.res': context.res.music.join('\n')
		}
	}
};

const generate = fileSystem => {
	const context = { fileSystem, generatedScripts: [],  errors: [], res: { gfx: [], music: [] } };
	return generateFromSource('startup', context);
};

module.exports = { generate };