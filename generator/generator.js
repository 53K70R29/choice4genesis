const { parse } = require('../parser/syntax-full');

const generateFromSource = (sourceName, fileSystem) => {
	const source = fileSystem.readSource(sourceName);
	const ast = parse(source);
	if (ast.errors) {
		return { errors: ast.errors };
	}

	const generated = ast.body.filter(({ type }) => type === 'text').map(({ text }) => `	VN_text("${text}");`).join('\n');
	return [
		`void *VS_${sourceName}() {`,
		generated,
		'}'
	].join('\n');
};

const generate = fileSystem => {
	const ast = generateFromSource('startup', fileSystem);
	if (ast.errors) {
		return { errors: ast.errors };
	}
	
	return { 
		scripts: { startup: ast }
	};
};

module.exports = { generate };