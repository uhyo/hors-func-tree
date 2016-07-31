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
    uniq,
    arrsub,
    genid,
    glbid,
} from './util';

interface FuncDict{
    [name: string]: Func;
}
// FUncに対して追加の引数を渡す指示
interface Binding{
    name: string;
    args: Array<Exp>;
}

export function lift({funcs, exp}: Program): Program{
    // まずfree variablesの収集
    // 既存の関数のなまえ
    const glbs = Object.keys(funcs);
    const dns = glbs.concat(fv(exp, true));
    const fs: FuncDict = {};
    for(let name in funcs){
        fs[name] = lift_func(funcs[name], fs, glbs, dns);
    }
    return {
        funcs: fs,
        exp: lift_exp(exp, fs, glbs, dns),
    };
}

function lift_func({args, body}: Func, fs: FuncDict, glbs: Array<string>, dns: Array<string>): Func{
    const body2 = lift_exp(body, fs, glbs, dns);
    return {
        args,
        body: body2,
    };
}

function lift_exp(exp: Exp, fs: FuncDict, glbs: Array<string>, dns: Array<string>): Exp{
    switch(exp.type){
        case 'unit':
        case 'bconst':
        case 'bundet':
        case 'variable':
            return exp;
        case 'application': {
            const {exp1, args} = exp;
            const exp1d = lift_exp(exp1, fs, glbs, dns);
            const argsd = args.map(e => lift_exp(e, fs, glbs, dns));
            // ふつうだ
            return make.application(exp1d, argsd);
        }
        case 'branch': {
            const {cond, exp1, exp2} = exp;

            const condd = lift_exp(cond, fs, glbs, dns);
            const exp1d = lift_exp(exp1, fs, glbs, dns);
            const exp2d = lift_exp(exp2, fs, glbs, dns);
            return make.branch(condd, exp1d, exp2d);
        }
        case 'lambda': {
            const {args, body} = exp;
            // あたらしいおなまえ
            const fn = glbid('F');

            // funcのbodyは先に変換しておく
            const body2 = lift_exp(body, fs, glbs, dns);

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
            dns.push(fn);
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
