/*it starts with index[1] 2nd element and compare it with first element if first[0] 
bigger than index[1] it swaps and if not then (first element and second element)+1 
Logic re-runs */ 


const insertionSort =( arr)=>{
    for(let i =1; i<arr.length;i++){
        let cur = arr[i];
        let j = i -1;
        while(j>=0 && arr[j] > cur){
            arr[j+1] = arr[j];
            j--;
        }
        arr[j+1] = cur;
    }
    return arr
}

const res = insertionSort([4,3,5,99,6,2,0]);
console.log(res)