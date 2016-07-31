// Expression -> Tree expression in DOT language
import {
    Exp,
} from './hors';

let glb_id = 1;

export function graph(exp: Exp): string{
    const [, nodes, edges] = graph_exp(exp);
    return `strict graph {
    graph [
        rankdir = TB,
        fontsize = 18
    ];
    node [shape = "none"];
${nodes}
${edges}
}`;
}
// 頂点ノード名, nodes, edges
export function graph_exp(exp: Exp): [string, string, string]{
    switch(exp.type){
        case 'terminal': {
            // 新しいノードができた
            const n = `n${glb_id}`;
            glb_id++;
            const nodes1 = `${n} [label = "${exp.name}"];\n`;
            return [n, nodes1, ''];
        }
        case 'application': {
            // 階層的なあれ
            const {exp1, args} = exp;
            const [nt, nodes1, edges1] = graph_exp(exp1);
            const argsa = args.map(graph_exp);
            // ノード, エッジ情報を集約
            let nodes2 = nodes1;
            let edges2 = edges1;
            for (let [t, nodes, edges] of argsa){
                nodes2 += nodes;
                edges2 += edges;
                // 上と下を繋げる
                edges2 += `${nt} -- ${t};\n`;
            }
            // 返す
            return [nt, nodes2, edges2];
        }
        default:
            throw new Error(`graph cannot handle a node of type "${exp.type}".`);
    }
}
