///<reference path='./node.d.ts' />
import {
    Program,
} from './ast';
import {
    printProgram,
} from './print';
import {
    printScheme,
    printExp,
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
    Exp as SExp,
} from './hors';
import {
    run,
} from './run';
import {
    graph,
} from './graph';

const cli = require('cli');
const parser = require('./lang').parser;


cli.withStdinLines((lines: Array<string>, newline: string)=>{
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
    console.log('---------- Run --------------------');
    // run hors
    let e: SExp = run(s, 8);
    console.log(printExp(e)[0]);
    console.log('---------- Graph ------------------');
    let g = graph(e);
    console.log(g);
});


