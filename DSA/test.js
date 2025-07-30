function binarySearch(arr, key){
    for(let i = 0; i<arr.length;i++){
        if(arr[i] === key){
            return arr[i]
        } else if(key!== arr[i]){
            return -1
            }
        }
}
const res = binarySearch([1,2,3,4,5,6], 4)
console.log(res);
