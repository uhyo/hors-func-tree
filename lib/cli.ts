///<reference path='./node.d.ts' />
import {
    Program,
} from './ast';
import {
    printProgram,
    printScheme,
} from './print';
import {
    cps,
} from './cps';
import {
    beta,
} from './beta';
import {
    lift,
} from './lift';
import {
    fromProgram,
} from './hors';

const cli = require('cli');
const util = require('util');
const parser = require('./lang').parser;


cli.withStdinLines((lines, newline)=>{
    const str = lines.join(newline);
    console.log(str);

    const p: Program = parser.parse(str);
    console.log(util.inspect(p, {
        depth: 5,
    }));
    console.log(printProgram(p));
    console.log('---------- CPS Transform ----------');
    const p2 = cps(p);
    console.log(printProgram(p2));
    console.log('---------- Beta Reduction ---------');
    const p3 = beta(p2);
    console.log(printProgram(p3));
    console.log('---------- Lambda Lifting ---------');
    const p4 = lift(p3);
    console.log(printProgram(p4));
    console.log('---------- HORS -------- ---------');
    const p5 = fromProgram(p4);
    console.log(printScheme(p5));
});


