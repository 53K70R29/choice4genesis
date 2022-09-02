const { parse } = require('./syntax');

test('parse simple lines', () => {
	
const SOURCE = `
Line 1
Line 2   
		
Line 3
`

	expect(parse(SOURCE)).toEqual({
		type: 'script',
		body: [
			{ type: 'text', line: 2, text: 'Line 1' },
			{ type: 'text', line: 3, text: 'Line 2' },
			{ type: 'blank', line: 4 },
			{ type: 'text', line: 5, text: 'Line 3' }
		]
	});
});

test('parse simple commands', () => {
	
const SOURCE = `
* example
*another
`

	expect(parse(SOURCE)).toEqual({
		type: 'script',
		body: [
			{ type: 'command', line: 2, command: 'example' },
			{ type: 'command', line: 3, command: 'another' }
		]
	});
});