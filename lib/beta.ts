// beta reduction
import {
    Program,
    Func,
    Exp,
    fv,
    assign,
    make,
} from './ast';
import {
    genid,
} from './util';

export function beta({funcs, exp}: Program): Program{
    const fs: {
        [name: string]: Func;
    } = {};
    for(let name in funcs){
        fs[name] = beta_func(funcs[name]);
    }
    return {
        funcs: fs,
        exp: beta_exp(exp),
    };
}

function beta_func({args, body}: Func): Func{
    return {
        args,
        body: beta_exp(body),
    };
}

function beta_exp(exp: Exp): Exp{
    switch(exp.type){
        case 'unit':
            return make.unit();
        case 'bconst':
            return make.bconst(exp.value);
        case 'bundet':
            return make.bundet();
        case 'variable':
            return make.variable(exp.name);
        case 'application': {
            const {exp1, args} = exp;
            const exp1d = beta_exp(exp1);
            const argsd = args.map(e => beta_exp(e));
            if (exp1d.type !== 'lambda'){
                // ふつーに
                return make.application(exp1d, argsd);
            }
            const {
                args: [x, ...xs],
                body,
            } = exp1d;
            // alpha変換が必要にならないか？
            const asgn = exp1d.args.map((a, i)=> ({
                from: a,
                to: args[i],
            }));
            const body2 = assign(body, asgn);
            return body2;
        }
        case 'branch': {
            const cond = beta_exp(exp.cond);
            const exp1 = beta_exp(exp.exp1);
            const exp2 = beta_exp(exp.exp2);
            return make.branch(cond, exp1, exp2);
        }
        case 'lambda':
            return make.lambda(exp.args, beta_exp(exp.body));
    }
}
