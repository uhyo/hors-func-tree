///<reference path='./node.d.ts' />
import {
    Program,
} from './ast';
import {
    printProgram,
} from './print';
import {
    printScheme,
} from './print-hors';
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
    optimize,
} from './optimize';
import {
    fromProgram,
} from './hors';

const cli = require('cli');
const parser = require('./lang').parser;


cli.withStdinLines((lines, newline)=>{
    const str = lines.join(newline);
    console.log(str);

    const p: Program = parser.parse(str);
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
    console.log('---------- Optimization -----------');
    const p5 = optimize(p4);
    console.log(printProgram(p5));
    console.log('---------- HORS -------------------');
    const p6 = fromProgram(p5);
    console.log(printScheme(p6));
});


