%lex

%%
' '|\t|\r|\n	/* skip whitespace */
"let"		return 'LET'
"and"		return 'AND'
"in"		return 'IN'
"true"		return 'TRUE'
"false"		return 'FALSE'
"if"		return 'IF'
"then"		return 'THEN'
"else"		return 'ELSE'
"="		return 'EQ'
"("		return 'LPAREN'
")"		return 'RPAREN'
"*"		return 'ASTERISK'
[A-Za-z_][A-Za-z0-9_]*	return 'IDENT'
<<EOF>>		return 'EOF'
.		return 'INVALID'

/lex

%start program

%%

program
	: LET funcs IN exp EOF	{ return ast.make.program($2, $4); }
	| exp EOF		{ return ast.make.program([], $1); }
	;

funcs
	: func			{ $$ = [$1] }
	| func AND funcs	{ $$ = [$1].concat($3) }
	;

func
	: IDENT args EQ exp { $$ = { name: $1, func: ast.make.func($2, $4, $1)} }
	;

args
	: IDENT args	{ $$ = [$1].concat($2) }
	| IDENT		{ $$ = [$1] }
	;

atom
	: LPAREN RPAREN		{ $$ = ast.make.unit() }
	| LPAREN exp RPAREN	{ $$ = $2 }
	| TRUE			{ $$ = ast.make.bconst(true) }
	| FALSE			{ $$ = ast.make.bconst(false) }
	| ASTERISK		{ $$ = ast.make.bundet() }
	| IDENT			{ $$ = ast.make.variable($1) }
	;
app
	: atom		{ $$ = $1 }
	| atom appargs	{ $$ = ast.make.application($1, $2) }
	;

appargs
	: atom		{ $$ = [$1] }
	| atom appargs	{ $$ = [$1].concat($2) }
	;

exp
	: app			{ $$ = $1 }
	| IF exp THEN exp ELSE exp
				{ $$ = ast.make.branch($2, $4, $6) }
	;

%%

var ast=require('./ast');
