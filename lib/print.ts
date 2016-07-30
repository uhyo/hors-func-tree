// prints AST.
import {
    Program,
    Exp,
} from './ast';

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
        case 'application':
            return '(' + printExp(exp.exp1) + ' ' + printExp(exp.exp2) + ')';
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
function indent(str: string, n: number): string{
    const id = ' '.repeat(n);
    return str.split('\n').map(l=> id + l).join('\n');
}
