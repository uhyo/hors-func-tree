import {
    Program,
    Func,
    Exp,
    make,
    fv,
} from './ast';
import {
    Type,
    isExternal,
} from './type';
import {
    genid,
    glbid,
} from './util';
import {
    endNonTerminal,
} from './const';


//CPS変換

export function cps({funcs, exp}: Program, map: WeakMap<Exp, Type>): Program{
    const fs: {
        [name: string]: Func;
    } = {};
    for(let name in funcs){
        fs[name] = cps_func(funcs[name], map);
    }
    const end = make.variable(endNonTerminal);
    const expd = cps_exp(exp, map);
    return {
        funcs: fs,
        exp: make.application(expd, [end]),
    };
}
function cps_func({args, body, orig_name}: Func, map: WeakMap<Exp, Type>): Func{
    // 継続の名前を決める
    const k = glbid('K');
    const kv = make.variable(k);
    return {
        args: args.concat([k]),
        body: make.application(cps_exp(body, map), [kv]),
        orig_name,
    };
}
function cps_exp(exp: Exp, map: WeakMap<Exp, Type>): Exp{
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
            const exp1d = cps_exp(exp1, map);

            const kn = glbid('K');
            const anames = args.map(x => x.type==='variable' ? glbid(x.name) : glbid('V'));
            const fn = glbid(exp1.type==='variable' ? exp1.name : 'F');
            // fが外部の関数だったらFに継続渡しスタイルを期待しない
            const exp1t = map.get(exp1);
            const ext = exp1t ? isExternal(exp1t) : false;
            const contl = ext ?
                // fが外部の関数
                make.lambda([fn], make.application(kn, [make.application(fn, anames.map(x => make.variable(x)))])) :
                // fはCPSの関数
                make.lambda([fn], make.application(fn, anames.map(x => make.variable(x)).concat([make.variable(kn)])));
            // 全部評価し終わったあとに呼び出すやつ
            let b = make.application(exp1d, [contl]);
            for (let i = args.length-1; i>=0; i--){
                const aexp = args[i];
                const a = anames[i];
                const h = make.lambda([a], b);
                const d = cps_exp(aexp, map);
                b = make.application(d, [h]);
            }
            return make.lambda([kn], b);
        }
        case 'branch': {
            const {cond, exp1, exp2} = exp;
            const condd = cps_exp(cond, map);
            const exp1d = cps_exp(exp1, map);
            const exp2d = cps_exp(exp2, map);

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
            const expd = cps_exp(body, map);
            const fvs = fv(exp, true);
            const k = genid('K', fvs);
            return make.lambda([k], make.lambda(args, expd));
        }
    }
}
