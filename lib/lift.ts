// lambda lifting
import {
    Program,
    Func,
    Exp,
    fv,
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
interface BindDict{
    [name: string]: Array<Exp>;
}

export function lift({funcs, exp}: Program): Program{
    // 既存の関数のなまえ
    const glbs = Object.keys(funcs);
    const dns = glbs.concat(fv(exp, true));
    const fs: FuncDict = {};
    const binds: BindDict = {};
    for(let name in funcs){
        binds[name] = [];
    }
    for(let name in funcs){
        fs[name] = lift_func(funcs[name], fs, binds, glbs, dns);
    }
    const exp2 = lift_exp(exp, fs, binds, glbs, dns);
    return {
        funcs: fs,
        exp: exp2,
    };
}

function lift_func({args, body}: Func, fs: FuncDict, binds: BindDict, glbs: Array<string>, dns: Array<string>): Func{
    return {
        args,
        body: lift_exp(body, fs, binds, glbs, dns),
    };
}

function lift_exp(exp: Exp, fs: FuncDict, binds: BindDict, glbs: Array<string>, dns: Array<string>): Exp{
    switch(exp.type){
        case 'unit':
        case 'bconst':
        case 'bundet':
        case 'variable':
            return exp;
        case 'application': {
            const {exp1, args} = exp;
            const exp1d = lift_exp(exp1, fs, binds, glbs, dns);
            const argsd = args.map(e => lift_exp(e, fs, binds, glbs, dns));
            if (exp1d.type === 'variable' && exp1d.name in binds){
                // liftされた関数だこれ
                return make.application(exp1d, argsd.concat(binds[exp1d.name]));
            }
            // ふつうだ
            return make.application(exp1d, argsd);
        }
        case 'branch': {
            const {cond, exp1, exp2} = exp;

            const condd = lift_exp(cond, fs, binds, glbs, dns);
            const exp1d = lift_exp(exp1, fs, binds, glbs, dns);
            const exp2d = lift_exp(exp2, fs, binds, glbs, dns);
            return make.branch(condd, exp1d, exp2d);
        }
        case 'lambda': {
            const {args, body} = exp;
            // あたらしいおなまえ
            const fn = glbid('F');
            // funcを生成
            const body2 = lift_exp(body, fs, binds, glbs, dns);
            // 自由変数を引数に突っ込む
            const fvs = arrsub(fv(body2), glbs.concat(args));
            const args2 = args.concat(fvs);
            binds[fn] = fvs.map(n => make.variable(n));

            const f = make.func(args2, body2);
            glbs.push(fn);
            dns.push(fn);
            fs[fn] = f;
            return make.variable(fn);
        }
    }
}
