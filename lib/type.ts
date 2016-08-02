// Type checking.
import {
    Program,
    Exp,
} from './ast';

interface UnitType{
    readonly type: "unit";
}
interface BoolType{
    readonly type: "bool";
}
interface FuncType{
    readonly type: "func";
    readonly from: Type;
    readonly to: Type;
}
interface RefType{
    readonly type: "ref";
    t: Type | undefined;
    id: number;
    external: boolean,
}

export type Type = UnitType | BoolType | FuncType | RefType;

interface TypeDict{
    [name: string]: Type;
}

export interface ProgramType{
    readonly funcs: TypeDict;
    readonly exp: Type;
    readonly map: WeakMap<Exp, Type>;
}

export function infer({funcs, exp}: Program): ProgramType{
    const env: TypeDict = {};
    // 全部型変数にする
    for(let name in funcs){
        env[name] = make.ref();
    }
    // アレを作る
    const map = new WeakMap<Exp, Type>();
    // 順に推論
    for(let name in funcs){
        const {args, body} = funcs[name];
        const t = infer_exp(env, map, {
            type: 'lambda',
            args,
            body,
        });
        unify(env[name], t);
    }
    const expt = infer_exp(env, map, exp);
    // 余計なrefを消す
    for(let name in env){
        env[name] = normalize(env[name]);
    }
    return {
        funcs: env,
        exp: expt,
        map,
    };
}

// 式の型推論
function infer_exp(env: TypeDict, map: WeakMap<Exp, Type>, exp: Exp): Type{
    switch(exp.type){
        case 'unit': {
            const t = make.unit();
            map.set(exp, t);
            return t;
        }
        case 'bconst':
        case 'bundet': {
            const t = make.bool();
            map.set(exp, t);
            return t;
        }
        case 'variable': {
            if (exp.name in env){
                const t = env[exp.name];
                map.set(exp, t);
                return t;
            }else{
                // 外部変数っぽいから環境に入れとく
                const t = make.extref();
                env[exp.name] = t;
                map.set(exp, t);
                return t;
            }
        }
        case 'application': {
            const {exp1, args} = exp;
            let t1 = infer_exp(env, map, exp1);
            const argst = args.map(e => infer_exp(env, map, e));
            // 順に適用
            while(argst.length > 0){
                const ft = make.func(make.ref(), make.ref());
                unify(t1, ft);

                //型を合わせる
                const a = argst.shift() as Type;    // undefinedがないことを明示
                unify(ft.from, a);
                if (isExternal(t1)){
                    t1 = make.extref(ft.to);
                }else{
                    t1 = ft.to;
                }
            }
            map.set(exp, t1);
            return t1;
        }
        case 'branch': {
            const {cond, exp1, exp2} = exp;
            const condt = infer_exp(env, map, cond);
            unify(condt, make.bool());
            const exp1t = infer_exp(env, map, exp1);
            const exp2t = infer_exp(env, map, exp2);
            // 型の一致
            unify(exp1t, exp2t);
            map.set(exp, exp1t);
            return exp1t;
        }
        case 'lambda': {
            const {args, body} = exp;
            // envのコピーが必要
            const env2: TypeDict = {};
            for(let name in env){
                env2[name] = env[name];
            }
            // 引数の型
            for(let a of args){
                env2[a] = make.ref();
            }
            let t = infer_exp(env2, map, body);
            // 型を組み立て
            const reva = args.concat([]).reverse();
            for(let a of reva){
                t = make.func(env2[a], t);
            }
            map.set(exp, t);
            return t;
        }

    }
}
function unify(t1: Type, t2: Type): void{
    // 2つの型を一致させる
    if (t1 === t2){
        return;
    }
    if (t1.type==='unit' && t2.type==='unit'){
        return;
    }
    if (t1.type==='bool' && t2.type==='bool'){
        return;
    }
    if (t1.type==='func' && t2.type==='func'){
        unify(t1.from, t2.from);
        unify(t1.to, t2.to);
        return;
    }
    if (t1.type==='ref' && (t2.type!=='ref' || t1.id < t2.id)){
        if (t1.t == null){
            t1.t = t2;
        }else{
            unify(t1.t, t2);
        }
        if (t2.type==='ref'){
            t1.external = t2.external = t1.external || t2.external;
        }
        return;
    }
    if (t2.type==='ref'){
        if (t2.t == null){
            t2.t = t1;
        }else{
            unify(t1, t2.t);
        }
        return;
    }
    throw new Error('TypeError');
}

// externalかどうか判定する
export function isExternal(t: Type): boolean{
    switch(t.type){
        case 'unit':
        case 'bool':
        case 'func':
            return false;
        case 'ref':
            return t.external || (t.t ? isExternal(t.t) : false);
    }
}

function normalize(t: Type): Type{
    switch(t.type){
        case 'unit':
        case 'bool':
            return t;
        case 'func':
            return make.func(normalize(t.from), normalize(t.to));
        case 'ref': {
            if (t.t == null){
                return t;
            }
            if (t.external === false || isExternal(t.t)){
                return normalize(t.t);
            }
            return make.extref(normalize(t.t));
        }
    }
}



export function printProgramType({funcs, exp}: ProgramType): string{
    let result = '';
    for(let name in funcs){
        const [ts, ] = printType(funcs[name]);
        result += `${name}: ${ts}\n`;
    }
    const [t, ] = printType(exp);
    return `${result}
${t}`;
}
function printType(t: Type): [string, boolean]{
    switch(t.type){
        case 'unit':
        case 'bool':
            return [t.type, true];
        case 'func': {
            const [t1, ] = printType(t.from);
            const [t2, a] = printType(t.to);
            if (a){
                return [`${t1} -> ${t2}`, false];
            }else{
                return [`${t1} -> (${t2})`, false];
            }
        }
        case 'ref':
            return t.t ? printType(t.t) : [`?(${t.id})`, true];

    }
}


namespace make{
    let ref_id = 1;
    export function unit(): UnitType{
        return {
            type: 'unit',
        };
    }
    export function bool(): BoolType{
        return {
            type: 'bool',
        }
    }
    export function func(t1: Type, t2: Type): FuncType{
        return {
            type: 'func',
            from: t1,
            to: t2,
        };
    }
    export function ref(t?: Type): RefType{
        return {
            type: 'ref',
            t,
            id: ref_id++,
            external: false,
        };
    }
    export function extref(t?: Type): RefType{
        return {
            type: 'ref',
            t,
            id: ref_id++,
            external: true,
        };
    }
}
