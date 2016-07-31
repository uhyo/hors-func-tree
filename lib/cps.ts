import {
    Program,
    Func,
    Exp,
    make,
    fv,
} from './ast';
import {
    genid,
    glbid,
} from './util';
import {
    endNonTerminal,
} from './const';


//CPS変換

export function cps({funcs, exp}: Program): Program{
    const fs: {
        [name: string]: Func;
    } = {};
    for(let name in funcs){
        fs[name] = cps_func(funcs[name]);
    }
    const end = make.variable(endNonTerminal);
    const expd = cps_exp(exp);
    return {
        funcs: fs,
        exp: make.application(expd, [end]),
    };
}
function cps_func({args, body, orig_name}: Func): Func{
    // 継続の名前を決める
    const k = glbid('K');
    const kv = make.variable(k);
    return {
        args: args.concat([k]),
        body: make.application(cps_exp(body), [kv]),
        orig_name,
    };
}
function cps_exp(exp: Exp): Exp{
    switch(exp.type){
        case 'unit':
            return make.lambda(['K'], make.application(make.variable('K'), [make.unit()]));
        case 'bconst':
            return make.lambda(['K'], make.application(make.variable('K'), [make.bconst(exp.value)]));
        case 'bundet':
            return make.lambda(['K'], make.application(make.variable('K'), [make.bundet()]));
        case 'variable': {
            const k = glbid('K');
            return make.lambda([k], make.application(k, [make.variable(exp.name)]));
        }
        case 'application': {
            // call-by-value
            const {exp1, args} = exp;
            const exp1d = cps_exp(exp1);

            const kn = glbid('K');
            const anames = args.map(x => x.type==='variable' ? glbid(x.name) : glbid('V'));
            const fn = glbid(exp1.type==='variable' ? exp1.name : 'F');
            const contl = make.lambda([fn], make.application(fn, anames.map(x => make.variable(x)).concat([make.variable(kn)])));
            // 全部評価し終わったあとに呼び出すやつ
            let b = make.application(exp1d, [contl]);
            for (let i = args.length-1; i>=0; i--){
                const aexp = args[i];
                const a = anames[i];
                const h = make.lambda([a], b);
                const d = cps_exp(aexp);
                b = make.application(d, [h]);
            }
            return make.lambda([kn], b);
        }
        case 'branch': {
            const {cond, exp1, exp2} = exp;
            const condd = cps_exp(cond);
            const exp1d = cps_exp(exp1);
            const exp2d = cps_exp(exp2);

            const cn = glbid(cond.type==='variable' ? cond.name : 'F');

            const kn = glbid('K');

            const cont1 = make.application(exp1d, [make.variable(kn)]);
            const cont2 = make.application(exp2d, [make.variable(kn)]);
            const ifb = make.branch(make.variable(cn), cont1, cont2);
            const cont = make.lambda([cn], ifb);
            const cont3 = make.lambda([kn], make.application(condd, [cont]));
            return cont3;
        }
        case 'lambda': {
            const {args, body} = exp;
            const expd = cps_exp(body);
            const fvs = fv(exp, true);
            const k = genid('K', fvs);
            return make.lambda([k], make.lambda(args, expd));
        }
    }
}
