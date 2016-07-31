import {
    uniq,
    arrsub,
} from './util';

// exp
export interface Unit{
    readonly type: "unit";
}
export interface BConst{
    readonly type: "bconst";
    readonly value: boolean;
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

// Internal
export interface Lambda{
    readonly type: "lambda";
    readonly args: Array<string>;
    readonly body: Exp;
}

export type Exp = Unit | BConst | BUndet | Variable | Application | Branch | Lambda;

export interface FuncDict{
    [name: string]: Func;
}

export interface Program{
    readonly funcs: FuncDict;
    readonly exp: Exp;
}
export interface Func{
    readonly args: Array<string>;
    readonly body: Exp;
    // original name.
    readonly orig_name: string | undefined;
}

// free variables.
export function fv(exp: Exp, all?: boolean): Array<string>{
    switch(exp.type){
        case 'unit':
        case 'bconst':
        case 'bundet':
            return [];
        case 'variable':
            return [exp.name];
        case 'application': {
            const fv1 = fv(exp.exp1, all);
            const fv2 = [].concat.apply([], exp.args.map(e=> fv(e, all)));
            return uniq([...fv1, ...fv2]);
        }
        case 'branch':
            return uniq([...fv(exp.cond, all), ...fv(exp.exp1, all), ...fv(exp.exp2, all)]);
        case 'lambda': {
            const a = fv(exp.body);
            if (all){
                return uniq([...a, ...exp.args]);
            }else{
                return arrsub(a, exp.args);
            }
        }
    }
}
// assignment.
export function assign(exp: Exp, asgn: Array<{
    from: string;
    to: Exp;
}>): Exp{
    switch(exp.type){
        case 'unit':
        case 'bconst':
        case 'bundet':
            return exp;
        case 'variable': 
            for (let {from ,to} of asgn){
                if (exp.name === from){
                    return to;
                }
            }
            return exp;
        case 'application': {
            const exp1 = assign(exp.exp1, asgn);
            const args = exp.args.map(e => assign(e, asgn));
            return make.application(exp1, args);
        }
        case 'branch':
            return make.branch(assign(exp.cond, asgn), assign(exp.exp1, asgn), assign(exp.exp2, asgn));
        case 'lambda': {
            // 引数になってる奴は立ち入らない
            const {args} = exp; /* ↓なぜかこの中でexpがExpに戻ってる */
            const asgn2 = asgn.filter(({from})=> args.indexOf(from) < 0);
            if (asgn2.length === 0){
                return exp;
            }else{
                return make.lambda(exp.args, assign(exp.body, asgn2));
            }
        }
    }
}

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
    export function lambda(args: Array<string>, body: Exp): Lambda{
        return {
            type: "lambda",
            args,
            body,
        };
    }

    export function func(args: Array<string>, body: Exp, orig_name?: string): Func{
        return {
            args,
            body,
            orig_name,
        };
    }
    export function program(funcs: Array<{
        name: string;
        func: Func;
    }>, exp: Exp): Program{
        const dic: {
            [name: string]: Func;
        } = {};
        for(let {name, func} of funcs){
            dic[name] = func;
        }
        return {
            funcs: dic,
            exp,
        };
    }
}
