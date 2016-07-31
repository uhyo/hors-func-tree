import {
    Scheme,
    Rule,
    Exp,
} from './hors';
import {
    atom,
    indent,
} from './print';


export function printScheme({rules}: Scheme): string{
    let result = '';
    for(let r of rules){
        result += printRule(r);
    }
    return result;
}
function printRule({name, args, body}: Rule): string{
    const a = args.join(' ') + (args.length===0 ? '' : ' ');
    const [b, ] = printExp(body);
    return `${name} ${a}= ${b}\n`;
}
function printExp(exp: Exp): [string, boolean]{
    switch(exp.type){
        case 'unit':
            return ['()', true];
        case 'bconst':
            return [String(exp.value), true];
        case 'terminal':
            return [`[${exp.name}]`, true];
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
    }
}
