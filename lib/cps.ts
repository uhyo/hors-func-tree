import {
    Program,
    Func,
    Exp,
    make,
    fv,
} from './ast';
import {
    uniq,
    genid,
} from './util';

//CPS変換

export function cps({funcs, exp}: Program): Program{
    const fs: {
        [name: string]: Func;
    } = {};
    for(let name in funcs){
        fs[name] = cps_func(funcs[name]);
    }
    const end = make.variable('END');
    const expd = cps_exp(exp);
    return {
        funcs: fs,
        exp: make.application(expd, end),
    };
}
function cps_func({args, body}: Func): Func{
    // 継続の名前を決める
    const k = genid('K', args);
    const kv = make.variable(k);
    return {
        args,
        body: cps_exp(body),
    };
}
function cps_exp(exp: Exp): Exp{
    switch(exp.type){
        case 'unit':
            return make.lambda(['K'], make.application(make.variable('K'), make.unit()));
        case 'bconst':
            return make.lambda(['K'], make.application(make.variable('K'), make.bconst(exp.value)));
        case 'bundet':
            return make.lambda(['K'], make.application(make.variable('K'), make.bundet()));
        case 'variable': {
            const k = genid('K', [exp.name]);
            return make.lambda([k], make.application(make.variable(k), make.variable(exp.name)));
        }
        case 'application': {
            // call-by-value
            const {exp1, exp2} = exp;
            const exp1d = cps_exp(exp1);
            const exp2d = cps_exp(exp2);
            const fvs = uniq([...fv(exp1d, true), ...fv(exp2d, true)]);
            const e1n = genid(exp1.type==='variable' ? exp1.name : 'F', fvs);
            const e2n = genid(exp2.type==='variable' ? exp2.name : 'V', fvs);
            const kn = genid('K', [e1n, e2n, ...fvs]);
            const cont3 = make.lambda([kn], make.application(make.variable(kn), make.application(make.variable(e1n), make.variable(e2n))));
            const cont2 = make.lambda([e1n], cont3);
            const cont1 = make.lambda([e2n], make.application(exp1d, cont2));
            return make.application(exp2d, cont1);
        }
        case 'branch': {
            const {cond, exp1, exp2} = exp;
            const condd = cps_exp(cond);
            const exp1d = cps_exp(exp1);
            const exp2d = cps_exp(exp2);

            const fvs = uniq([...fv(condd, true), ...fv(exp1d, true), ...fv(exp2d, true)]);
            const cn = genid(cond.type==='variable' ? cond.name : 'F', fvs);
            const e1n = genid(exp1.type==='variable' ? exp1.name : 'F', fvs);
            const e2n = genid(exp2.type==='variable' ? exp2.name : 'V', fvs);

            const kn = genid('K', [cn, e1n, e2n, ...fvs]);

            const cont1 = make.lambda([e1n], make.lambda([kn], make.application(make.variable(kn), make.variable(e1n))));
            const cont2 = make.lambda([e2n], make.lambda([kn], make.application(make.variable(kn), make.variable(e2n))));
            const fb = make.branch(make.variable(cn), make.application(exp1d, cont1), make.application(exp2d, cont2));
            const cont3 = make.lambda([cn], fb);
            return make.application(condd, cont3);
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
