// HORSを展開する
import {
    Scheme,
    Rule,
    Exp,
    make,
    assign,
} from './hors';
import {
    ellipsisTerminal,
} from './const';

export function run({rules, start}: Scheme, depth: number): Exp{
    // depthの深さまで木を生成する
    return runExp(make.variable(start), rules, depth);
}

export function runExp(exp: Exp, rules: Array<Rule>, depth: number): Exp{
    console.log(exp);
    if (depth <= 0){
        //深さを超えたので中断
        return make.terminal(ellipsisTerminal);
    }
    switch(exp.type){
        case 'unit':
        case 'bconst':
        case 'bundet':
            // お前らが来るのはちょっとおかしいのでは？
            return exp;
        case 'terminal':
            // お前はそのままでいいぞ
            return exp;
        case 'variable':
            // 引数0個のあれかも
            for (let {name, args, body} of rules){
                if (name === exp.name && args.length === 0){
                    return runExp(body, rules, depth);
                }
            }
            return exp;
        case 'application': {
            const {exp1, args} = exp;
            if (exp1.type === 'application'){
                // (f x) y の形になっているぞ
                const napp = make.application(exp1.exp1, exp1.args.concat(args));
                return runExp(napp, rules, depth);
            }
            const exp1d = runExp(exp1, rules, depth);
            if (exp1d.type === 'terminal'){
                // 終端記号だから中に入る
                const argsd = args.map(e => runExp(e, rules, depth-1));
                return make.application(exp1d, argsd);
            }else if(exp1d.type === 'variable'){
                // variabeをapplyする
                for (let {name, args: args2, body} of rules){
                    if (name === exp1d.name){
                        // ruleがあったので適用
                        const asgn = args2.map((a, i)=>({
                            from: a,
                            to: args[i],
                        }));
                        const newexp = assign(body, asgn);
                        return runExp(newexp, rules, depth);
                    }
                }
                throw new Error(`No rule applies to ${exp1d.name}`);
            }else{
                throw new Error('Cannot resolve application');
            }
        }

    }
}
