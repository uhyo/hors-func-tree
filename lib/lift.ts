// lambda lifting
import {
    Program,
    Func,
    Exp,
    fv,
    assign,
    make,
} from './ast';
import {
    arrsub,
    glbid,
} from './util';

interface FuncDict{
    [name: string]: Func;
}

export function lift({funcs, exp}: Program): Program{
    // まずfree variablesの収集
    // 既存の関数のなまえ
    const glbs = Object.keys(funcs);
    const fs: FuncDict = {};
    for(let name in funcs){
        fs[name] = lift_func(funcs[name], fs, glbs);
    }
    return {
        funcs: fs,
        exp: lift_exp(exp, fs, glbs),
    };
}

function lift_func({args, body, orig_name}: Func, fs: FuncDict, glbs: Array<string>): Func{
    const body2 = lift_exp(body, fs, glbs);
    return {
        args,
        body: body2,
        orig_name,
    };
}

function lift_exp(exp: Exp, fs: FuncDict, glbs: Array<string>): Exp{
    switch(exp.type){
        case 'unit':
        case 'bconst':
        case 'bundet':
        case 'variable':
            return exp;
        case 'application': {
            const {exp1, args} = exp;
            const exp1d = lift_exp(exp1, fs, glbs);
            const argsd = args.map(e => lift_exp(e, fs, glbs));
            // ふつうだ
            return make.application(exp1d, argsd);
        }
        case 'branch': {
            const {cond, exp1, exp2} = exp;

            const condd = lift_exp(cond, fs, glbs);
            const exp1d = lift_exp(exp1, fs, glbs);
            const exp2d = lift_exp(exp2, fs, glbs);
            return make.branch(condd, exp1d, exp2d);
        }
        case 'lambda': {
            const {args, body} = exp;
            // あたらしいおなまえ
            const fn = glbid('F');

            // funcのbodyは先に変換しておく
            const body2 = lift_exp(body, fs, glbs);

            // bodyに登場する自由変数を列挙する
            const fvs = arrsub(fv(body2), glbs.concat(args));

            // 変数名を付け替える
            const fvs2 = fvs.map(x => glbid(x));
            const asgn = fvs.map((old, i)=> ({
                from: old,
                to: make.variable(fvs2[i]),
            }));
            const body3 = assign(body2, asgn);
            // 部分適用の関係で自由変数を先にする
            const args2 = fvs2.concat(args);

            // 新しい関数を入れる
            const f = make.func(args2, body3);
            // 関数を登録
            glbs.push(fn);
            fs[fn] = f;
            // 関数に対する部分適用
            if (fvs.length === 0){
                return make.variable(fn);
            }else{
                return make.application(fn, fvs.map(x => make.variable(x)));
            }
        }
    }
}
