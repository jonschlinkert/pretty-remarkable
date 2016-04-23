Some markdown links.

[ghi]
[abc][]
[abc](one)
[abc][] this is after
[abc123][]{#zzz}  this is after
[def][def] this is after
![def][def]
![def](blah){#xxx}

[abc123]: hhhhh

More markdown links.

[nada]
[abc][]
[abc][nothing]
[lslslssls][]{#zzz}
[def][def]
![def][def]
![def][def]{#zzz}
[jkl](){#zzz}
![jkl]()
[jkl](mno)
![jkl](mno)
![jkl](mno){#zzz}
[jkl](mno#pqr)
[jkl](mno#pqr){#stu}
[jkl](mno){#vwx}
![jkl](mno){#vwx}

Even more markdown links.

[def][def] this is after
![def][def]
![def](blah){#xxx} this is resolved from `options.context`


[lslslssls]: foo/bar