///<reference path='./node.d.ts' />
import {
    Program,
} from './ast';

const cli = require('cli');
const util = require('util');
const parser = require('./lang').parser;


cli.withStdinLines((lines, newline)=>{
    const str = lines.join(newline);
    console.log(str);

    const p: Program = parser.parse(str);
    console.log(util.inspect(p, {
        depth: 4,
    }));
});


