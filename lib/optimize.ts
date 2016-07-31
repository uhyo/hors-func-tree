// 最適化
import {
    Program,
    FuncDict,
    Func,
    Exp,
    make,
} from './ast';

// 全ての
export function optimize(p: Program): Program{
    const p1 = singleStepApplication(p);
    const p2 = cutUnreachableBranch(p1);
    return p2;
}

// Expに作用するだけの最適化を簡単につくる
export function simple(opt: (e: Exp)=>Exp): (p: Program)=>Program{

    return optProgram;
    function optProgram({funcs, exp}: Program): Program{
        const fs: FuncDict = {};
        for (let name in funcs){
            fs[name] = optFunc(funcs[name]);
        }
        return {
            funcs: fs,
            exp: opt(exp),
        };
    }

    function optFunc({args, body, orig_name}: Func): Func{
        return {
            args,
            body: opt(body),
            orig_name,
        };
    }
}

// 多段のapplicationを1回にする
const singleStepApplication = simple(function opt(exp: Exp): Exp{
    switch(exp.type){
        case 'unit':
        case 'bconst':
        case 'bundet':
        case 'variable':
            return exp;
        case 'application': {
            const {exp1, args} = exp;
            const exp1d = opt(exp1);
            const argsd = args.map(e => opt(e));
            if (exp1d.type === 'application'){
                // 多段適用を検出
                const {exp1: exp11, args: args1} = exp1d;
                return make.application(exp11, args1.concat(argsd));
            }
            return make.application(exp1d, argsd);
        }
        case 'branch': {
            const {cond, exp1, exp2} = exp;
            const condd = opt(cond);
            const exp1d = opt(exp1);
            const exp2d = opt(exp2);
            return make.branch(condd, exp1d, exp2d);
        }
        case 'lambda':
            return make.lambda(exp.args, opt(exp.body));
    }
});

// 定数のbranchを消す
const cutUnreachableBranch = simple(function opt(exp: Exp): Exp{
    switch(exp.type){
        case 'unit':
        case 'bconst':
        case 'bundet':
        case 'variable':
            return exp;
        case 'application': {
            const {exp1, args} = exp;
            const exp1d = opt(exp1);
            const argsd = args.map(opt);
            return make.application(exp1d, argsd);
        }
        case 'branch': {
            const {cond, exp1, exp2} = exp;
            const condd = opt(cond);
            const exp1d = opt(exp1);
            const exp2d = opt(exp2);
            if (condd.type === 'bconst'){
                return condd.value ? exp1d : exp2d;
            }
            return make.branch(condd, exp1d, exp2d);
        }
        case 'lambda': {
            const {args, body} = exp;
            return make.lambda(args, opt(body));
        }
    }
});
