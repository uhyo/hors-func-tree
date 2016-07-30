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
    readonly exp2: Exp;
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

export interface Program{
    readonly funcs: {
        [name: string]: Func;
    };
    readonly exp: Exp;
}
export interface Func{
    readonly args: Array<string>;
    readonly body: Exp;
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
        case 'application':
            return uniq([...fv(exp.exp1, all), ...fv(exp.exp2, all)]);
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
    export function application(exp1: Exp, exp2: Exp): Application{
        return {
            type: "application",
            exp1,
            exp2,
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

    export function func(args: Array<string>, body: Exp): Func{
        return {
            args,
            body,
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
