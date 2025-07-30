function longSubStringWithoutRepeat(s){

let end = 0;
let start = 0;
let maxLength = 0;

const UniquecharSet = new Set();

    while(end < s.length){
        if(!UniquecharSet.has(s[end])){
            UniquecharSet.add(s[end]);
            end++
            maxLength=Math.max(maxLength,UniquecharSet.size);
        } else {
            UniquecharSet.delete(s[start]);
            start++
        }
    }
    return maxLength;
};

const res = longSubStringWithoutRepeat("bababa");
console.log(res);