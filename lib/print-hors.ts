import {
    Scheme,
    Rule,
    Exp,
} from './hors';
import {
    atom,
} from './print';
import {
    endTerminal,
    branchTerminal,
    unitTerminal,
} from './const';


export function printScheme({rules, start}: Scheme): string{
    let result = '%GRAMMAR\n';
    // startから
    const sr = rules.find(({name})=> name === start);
    if (sr != null){
        result += printRule(sr);
    }
    for(let r of rules){
        if (r.name !== start){
            result += printRule(r);
        }
    }
    result += '\n%TRANSITION\n';
    result += printAutom(rules);
    return result;
}
function printRule({name, args, body}: Rule): string{
    const a = args.join(' ') + (args.length===0 ? '' : ' ');
    const [b, ] = printExp(body);
    return `${name} ${a}-> ${b}.\n`;
}
export function printExp(exp: Exp): [string, boolean]{
    switch(exp.type){
        case 'unit':
            return ['()', true];
        case 'bconst':
            return [String(exp.value), true];
        case 'terminal':
            return [`${exp.name}'`, true];
        case 'bundet':
            return ['*', true];
        case 'variable':
            return [exp.name, true];
        case 'application': {
            const f = atom(printExp(exp.exp1));
            const a = exp.args.map(e => atom(printExp(e))).join(' ');
            return [`${f} ${a}`, false];
        }
    }
}

function printAutom(rules: Array<Rule>): string{
    // すべてのterminalを列挙
    const terminals = new Set<string>();
    for (let rule of rules){
        runExp(rule.body);
    }
    const qinit = 'q_init';
    let result = '';
    result += oneq(qinit);
    terminals.forEach(term=>{
        if (![endTerminal, unitTerminal, branchTerminal].includes(term)){
            result += oneq(`q_${term}`);
        }
    });

    return result;

    function oneq(q: string): string{
        let result = '';

        terminals.forEach(term=>{
            switch (term){
                case endTerminal:
                case unitTerminal:
                    result += `${q} ${term}' -> true.\n`;
                    break;
                case branchTerminal:
                    result += `${q} ${term}' -> (1, ${qinit}) /\\ (2, ${qinit}).\n`;
                    break;
                default:
                    result += `${q} ${term}' -> (1, q_${term}).\n`;
                    break;
            }
        });
        return result;
    }

    function runExp(exp: Exp){
        switch (exp.type){
            case 'unit':
            case 'bconst':
            case 'bundet':
            case 'variable':
                return;
            case 'terminal':
                terminals.add(exp.name);
                return;
            case 'application':
                runExp(exp.exp1);
                for (let a of exp.args){
                    runExp(a);
                }
                return;
        }
    }
}
