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
        const e = indent(printExp(f.body)[0], 2);
        result += ln + e + '\n';

        fl = true;
    }
    if (result){
        result += 'in ';
    }
    result += printExp(p.exp)[0];
    return result;
}

function printExp(exp: Exp): [string, boolean]{
    switch(exp.type){
        case 'unit':
            return ['()', true];
        case 'bconst':
            return [String(exp.value), true];
        case 'bundet':
            return ['*', true];
        case 'variable':
            return [exp.name, true];
        case 'application': {
            const f = atom(printExp(exp.exp1));
            const a = exp.args.map(e => atom(printExp(e))).join(' ');
            return [`${f} ${a}`, false];
        }
        case 'branch': {
            const cond = atom(printExp(exp.cond));
            const exp1 = atom(printExp(exp.exp1));
            const exp2 = atom(printExp(exp.exp2));
            return ['if ' + cond + ' then\n' + indent(exp1, 2) + '\nelse\n' + indent(exp2, 2), false];
        }
        case 'lambda': {
            const args = exp.args.join(' ');
            const [body, ] = printExp(exp.body);
            return [`\\${args}. ${body}`, false];
        }
        // なぜこれが必要なのか？
        default:
            throw new Error('a');
    }
}

// handle atom str.
export function atom([str, at]: [string, boolean]): string{
    if (at){
        return str;
    }else{
        return `(${str})`;
    }
}

export function indent(str: string, n: number): string{
    const id = ' '.repeat(n);
    return str.split('\n').map(l=> id + l).join('\n');
}
