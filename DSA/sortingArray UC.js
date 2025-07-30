let arr = [-5,-3,-1,0,2,4,6,8,-4];
function findPair(arr){
    let pair ={};
    for(let i=0;i<arr.length;i++){
        let x = arr[i];
        if(pair[x]){
            return [x, arr[i]];
        }
        pair[arr[i]] = 1
    }
    return [];
}


const pair = findPair(arr);
console.log(arr);