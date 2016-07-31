// 特別な意味を持つ値

// HORSにおける開始記号
export const startNonTerminal = '$Start$';
// プログラム終了を表す非終端器号と終端器号
export const endNonTerminal = '$End$';
export const endTerminal = '$End$';
// branchを表す終端器号
export const branchTerminal = '$br$';

// run時に木の深さが超えたら生成するterminal
export const ellipsisTerminal = '…';

