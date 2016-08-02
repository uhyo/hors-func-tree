///<reference path='./node.d.ts' />
import {
    Program,
} from './ast';
import {
    ProgramType,
    infer,
    printProgramType,
} from './type';
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
import {
    printScheme,
} from './print-hors';

const DEBUG = true;

const parser = require('./lang').parser;
const viz = require('viz.js');


document.addEventListener('DOMContentLoaded', ()=>{
    const error = document.querySelector('#error') as HTMLDivElement;
    const result = document.querySelector('#result') as HTMLDivElement;
    const inputarea = document.querySelector('#input') as HTMLTextAreaElement;

    document.querySelector('#run-button').addEventListener('click', ()=>{
        const input = inputarea.value;

        empty(result);
        empty(error);
        setTimeout(()=>{
            try {
                let p: Program = parser.parse(input);

                box(result, 'Parse Result', `<pre><code>${printProgram(p)}</code></pre>`);
                let t: ProgramType = infer(p);
                console.log(t);
                box(result, 'Type Inference', `<pre><code>${printProgramType(t)}</code></pre>`);

                p = cps(p);
                box(result, 'CPS Transform', `<pre><code>${printProgram(p)}</code></pre>`);

                p = beta(p);
                box(result, 'Beta Reduction', `<pre><code>${printProgram(p)}</code></pre>`);
                p = lift(p);
                p = optimize(p);
                box(result, 'Lambda Lifting', `<pre><code>${printProgram(p)}</code></pre>`);

                const s: Scheme = fromProgram(p);
                if (DEBUG || location.search === '?hors=yes'){
                    box(result, 'Higher Order Recursion Scheme', `<pre><code>${printScheme(s)}</code></pre>`);
                }else{
                    box(result, 'Higher Order Recursion Scheme', `？？？？？？？？？？（レポートの締め切り前なので）`);
                }

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
            }catch(e){
                error.textContent = String(e && e.message);
                return;
            }
        }, 0);
    }, false);

    const bts = document.querySelectorAll('.sample-button');
    for(let i = 0; i < bts.length; i++){
        const b = bts[i];
        b.addEventListener('click', ()=>{
            inputarea.value = b.getAttribute('data-code') || '';
        }, false);
    }
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
