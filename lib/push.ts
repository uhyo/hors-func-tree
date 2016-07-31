// push application into branch
import {
    Program,
    FuncDict,
    Func,
    Exp,
    make,
} from './ast';

// 作ったけど要らなかった可能性高し

export function push({funcs, exp}: Program): Program{
    const fs: FuncDict = {};
    for (let name in funcs){
        fs[name] = push_func(funcs[name]);
    }
    return {
        funcs: fs,
        exp: push_exp(exp),
    };
}

function push_func({args, body, orig_name}: Func): Func{
    return {
        args,
        body: push_exp(body),
        orig_name,
    };
}

function push_exp(exp: Exp): Exp{
    switch(exp.type){
        case 'unit':
        case 'bconst':
        case 'bundet':
        case 'variable':
            return exp;
        case 'application': {
            const {exp1, args} = exp;
            const exp1d = push_exp(exp1);
            const argsd = args.map(push_exp);
            return push_app(exp1d, argsd);
        }
        case 'branch': {
            const {cond, exp1, exp2} = exp;
            const condd = push_exp(cond);
            const exp1d = push_exp(exp1);
            const exp2d = push_exp(exp2);
            return make.branch(condd, exp1d, exp2d);
        }
        case 'lambda':
            return make.lambda(exp.args, push_exp(exp.body));
    }
}

function push_app(exp: Exp, args: Array<Exp>): Exp{
    // 構造に踏み込んでapplyする
    switch(exp.type){
        case 'unit':
        case 'bconst':
        case 'bundet':
        case 'variable':
        case 'application':
        case 'lambda':
            return make.application(exp, args);
        case 'branch': {
            // 中に踏み込む
            const {cond, exp1, exp2} = exp;
            const exp1d = push_app(exp1, args);
            const exp2d = push_app(exp2, args);
            return make.branch(cond, exp1d, exp2d);
        }
    }
}
