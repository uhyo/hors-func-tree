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
    Scheme,
    fromProgram,
} from './hors';

const cli = require('cli');
const parser = require('./lang').parser;


cli.withStdinLines((lines, newline)=>{
    const str = lines.join(newline);
    console.log(str);

    let p: Program = parser.parse(str);
    console.log(printProgram(p));
    console.log('---------- CPS Transform ----------');
    p = cps(p);
    console.log(printProgram(p));
    console.log('---------- Beta Reduction ---------');
    p = beta(p);
    console.log(printProgram(p));
    console.log('---------- Lambda Lifting ---------');
    p = lift(p);
    console.log(printProgram(p));
    console.log('---------- Optimization -----------');
    p = optimize(p);
    console.log(printProgram(p));
    console.log('---------- HORS -------------------');
    let s: Scheme = fromProgram(p);
    console.log(printScheme(s));
});


