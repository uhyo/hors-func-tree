// Higher Order Recursion Scheme
import * as ast from './ast';
import {
    startNonTerminal,
    endTerminal,
    branchTerminal,
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

// Exp of HORS
export interface Unit{
    readonly type: "unit";
}
export interface BConst{
    readonly type: "bconst";
    readonly value: boolean;
}
// terminal.
export interface Terminal{
    readonly type: "terminal";
    readonly name: string;
}
// undetermined boolean value.
export interface BUndet{
    readonly type: "bundet";
}
export interface Variable{
    readonly type: "variable";
    readonly name: string;
}
export interface Application{
    readonly type: "application";
    readonly exp1: Exp;
    readonly args: Array<Exp>;
}
export interface Branch{
    readonly type: "branch";
    readonly cond: Exp;
    readonly exp1: Exp;
    readonly exp2: Exp;
}
export type Exp = Unit | BConst | Terminal | BUndet | Variable | Application | Branch;

export namespace make{
    export function unit(): Unit{
        return {
            type: "unit",
        };
    }
    export function bconst(value: boolean): BConst{
        return {
            type: "bconst",
            value,
        };
    }
    export function bundet(): BUndet{
        return {
            type: "bundet",
        };
    }
    export function terminal(name: string): Terminal{
        return {
            type: "terminal",
            name,
        };
    }
    export function variable(name: string): Variable{
        return {
            type: "variable",
            name,
        };
    }
    export function application(exp1: Exp | string, args: Array<Exp>): Application{
        //exp1: string is shorthand.
        return {
            type: "application",
            exp1: 'string'===typeof exp1 ? variable(exp1) : exp1,
            args,
        };
    }
    export function branch(cond: Exp, exp1: Exp, exp2: Exp): Branch{
        return {
            type: "branch",
            cond,
            exp1,
            exp2,
        };
    }
}

// Program -> Scheme
export function fromProgram({funcs, exp}: ast.Program): Scheme{
    const rules: Array<Rule> = [];
    const terminal: Array<string> = [endTerminal, branchTerminal];
    for(let name in funcs){
        const f = funcs[name];
        rules.push(funcToRule(name, f));
        // ↓ここのterminalの作り方がアレ
        if (f.orig_name){
            terminal.push(f.orig_name);
        }
    }
    // 開始記号
    rules.push({
        name: startNonTerminal,
        args: [],
        body: convExp(exp),
    });
    return {
        rules,
        start: startNonTerminal,
        terminal,
    };
}

function funcToRule(name: string, {args, body}: ast.Func): Rule{
    return {
        name,
        args,
        body: convExp(body),
    };
}

// expの変換
function convExp(exp: ast.Exp): Exp{
    switch(exp.type){
        case 'unit':
        case 'bconst':
        case 'bundet':
        case 'variable':
            return exp;
        case 'application': {
            const {exp1, args} = exp;
            const exp1d = convExp(exp1);
            const argsd = args.map(convExp);
            return make.application(exp1d, argsd);
        }
        case 'branch': {
            const {exp1, exp2} = exp;
            const exp1d = convExp(exp1);
            const exp2d = convExp(exp2);
            // branchにする
            return make.application(branchTerminal, [exp1d, exp2d]);
        }
        case 'lambda':
            // lambdaは許容しない
            throw new Error('Lambda is not allowed here');

    }
}
