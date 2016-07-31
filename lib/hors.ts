// Higher Order Recursion Scheme
import {
    Program,
    Func,
    Exp,
} from './ast';
import {
    startNonTerminal,
} from './const';

export interface Scheme{
    // 書き換え規則の一覧
    rules: Array<Rule>;
    // 開始記号
    start: string;
    // 終端記号の一覧
    terminal: Array<string>;
}
export interface Rule{
    name: string;
    args: Array<string>;
    body: Exp;
}

// Program -> Scheme
export function fromProgram({funcs, exp}: Program): Scheme{
    const rules: Array<Rule> = [];
    const terminal: Array<string> = [];
    for(let name in funcs){
        const f = funcs[name];
        rules.push(funcToRule(name, f));
        if (f.orig_name){
            terminal.push(f.orig_name);
        }
    }
    // 開始記号
    rules.push({
        name: startNonTerminal,
        args: [],
        body: exp,
    });
    return {
        rules,
        start: startNonTerminal,
        terminal,
    };
}

function funcToRule(name: string, {args, body}: Func): Rule{
    return {
        name,
        args,
        body,
    };
}
