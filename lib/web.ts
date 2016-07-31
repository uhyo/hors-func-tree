///<reference path='./node.d.ts' />
import {
    Program,
} from './ast';
import {
    cps,
} from './cps';
import {
    beta,
} from './beta';
import {
    lift,
} from './lift';
import {
    optimize,
} from './optimize';
import {
    Scheme,
    fromProgram,
    Exp as SExp,
} from './hors';
import {
    run,
} from './run';
import {
    graph,
} from './graph';
import {
    printProgram,
} from './print';
/*
import {
    printScheme,
} from './print-hors';
*/


const parser = require('./lang').parser;
const viz = require('viz.js');


document.addEventListener('DOMContentLoaded', ()=>{
    const error = document.querySelector('#error') as HTMLDivElement;
    const result = document.querySelector('#result') as HTMLDivElement;

    document.querySelector('#run-button').addEventListener('click', ()=>{
        const input = (document.querySelector('#input') as HTMLTextAreaElement).value;

        empty(result);
        let p: Program;
        try {
            p = parser.parse(input);
        }catch(e){
            error.textContent = String(e);
            return;
        }
        box(result, 'Parse Result', `<pre><code>${printProgram(p)}</code></pre>`);

        p = cps(p);
        box(result, 'CPS Transform', `<pre><code>${printProgram(p)}</code></pre>`);

        p = beta(p);
        box(result, 'Beta Reduction', `<pre><code>${printProgram(p)}</code></pre>`);
        p = lift(p);
        p = optimize(p);

        const s: Scheme = fromProgram(p);
        // box(result, 'Higher Order Recursion Scheme', `<pre><code>${printScheme(s)}</code></pre>`);
        box(result, 'Higher Order Recursion Scheme', `？？？？？？？？？？（レポートの締め切り前なので）`);

        const e: SExp = run(s, 8);
        const dot: string = graph(e);

        //render graph
        const svg = viz(dot, {
            engine: 'dot',
            format: 'svg',
        });
        const blob = new Blob([svg], {
            type: 'image/svg+xml',
        });
        const url = URL.createObjectURL(blob);

        box(result, 'Result Tree', `<img src="${url}" class="graph">`);
    }, false);
}, false);

function empty(elm: HTMLElement): void{
    while(elm.hasChildNodes()){
        elm.removeChild(elm.firstChild);
    }
}

function box(result: HTMLElement, title: string, content: string): void{
    const html = `<section class="box">
    <h3>${title}</h3>
${content}
</section>
`;
    result.insertAdjacentHTML('beforeend', html);
}
