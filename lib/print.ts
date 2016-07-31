// prints AST.
import {
    Program,
    Exp,
} from './ast';
import {
    Scheme,
    Rule,
} from './hors';

export function printProgram(p: Program): string{
    let fl = false;
    let result = '';
    for(let name in p.funcs){
        const f = p.funcs[name];
        const prf = fl ? 'and' : 'let';
        const args = f.args.join(' ');
        const ln = `${prf} ${name} ${args} =\n`;
        const e = indent(printExp(f.body), 2);
        result += ln + e + '\n';

        fl = true;
    }
    if (result){
        result += 'in ';
    }
    result += printExp(p.exp);
    return result;
}

function printExp(exp: Exp): string{
    switch(exp.type){
        case 'unit':
            return '()';
        case 'bconst':
            return String(exp.value);
        case 'bundet':
            return '*';
        case 'variable':
            return exp.name;
        case 'application': {
            const f = printExp(exp.exp1);
            const a = exp.args.map(e => printExp(e)).join(' ');
            return `(${f} ${a})`;
        }
        case 'branch': {
            const cond = printExp(exp.cond);
            const exp1 = printExp(exp.exp1);
            const exp2 = printExp(exp.exp2);
            return 'if ' + cond + ' then\n' + indent(exp1, 2) + '\nelse\n' + indent(exp2, 2);
        }
        case 'lambda': {
            const args = exp.args.join(' ');
            const body = printExp(exp.body);
            return `(\\${args}. ${body})`;
        }

    }
}

export function printScheme({rules}: Scheme): string{
    let result = '';
    for(let r of rules){
        result += printRule(r);
    }
    return result;
}
function printRule({name, args, body}: Rule): string{
    const a = args.join(' ');
    const b = printExp(body);
    return `${name} ${a} = ${b}\n`;
}



function indent(str: string, n: number): string{
    const id = ' '.repeat(n);
    return str.split('\n').map(l=> id + l).join('\n');
}
