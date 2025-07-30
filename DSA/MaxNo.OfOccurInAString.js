function charInString(str){
    let map = {};
    str.split("").forEach(element => {
        map[element]=map[element]?map[element]+1:1;
    });
    let max = 1;
    let char = str[0]
    for(let k in map){
        if(map[k] > max){
            max = map[k];
            char=k;
        }
    }
    return char || -1
}

const ans = charInString("Ayush Mehrotra");
console.log(ans);