// utils.

export function uniq(arr: Array<string>): Array<string>{
    const table: {
        [idx: string]: boolean;
    } = {};
    const result: Array<string> = [];
    for(let elm of arr){
        if (!(elm in table)){
            result.push(elm);
            table[elm] = true;
        }
    }
    return result;
}

export function arrsub(arr1: Array<string>, arr2: Array<string>): Array<string>{
    const table: {
        [idx: string]: boolean;
    } = {};
    for(let elm of arr2){
        table[elm] = true;
    }
    const result: Array<string> = [];
    for(let elm of arr1){
        if (!(elm in table)){
            result.push(elm);
            table[elm] = true;
        }
    }
    return result;
}

// generate new id.
export function genid(base: string, expect: Array<string>): string{
    if (expect.indexOf(base) < 0){
        return base;
    }
    for(let i=1;;i++){
        const id = base + i;
        if (expect.indexOf(id) < 0){
            return id;
        }
    }
}
