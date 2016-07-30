
// exp
export interface Unit{
    type: "unit";
}
export interface BConst{
    type: "bconst";
    value: boolean;
}
// undetermined boolean value.
export interface BUndet{
    type: "bundet";
}
export interface Variable{
    type: "variable";
    name: string;
}
export interface Application{
    type: "application";
    exp1: Exp;
    exp2: Exp;
}
export interface Branch{
    type: "branch";
    cond: Exp;
    exp1: Exp;
    exp2: Exp;
}

export type Exp = Unit | BConst | BUndet | Variable | Application | Branch;

export interface Program{
    funcs: {
        [name: string]: Func;
    };
    exp: Exp;
}
export interface Func{
    args: Array<string>;
    body: Exp;
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
