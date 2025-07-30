// A Sorting Algorithm where the largest value bubble up at the top

function bubbleSort(array){
    for(let i = array.length; i > 0; i--){
        for(let j = 0 ; j < i-1; j++){
            if(array[j] > array[j+1]){
                [array[j],array[j+1]] = [array[j+1],array[j]]
            }
        }
    }
    return array;
}
const res = bubbleSort([5,6,4,3,76,9,1])
console.log(res)

// Optimized Version

function bubbleSort(array){
    for(let i = array.length; i > 0; i--){
        let isSwapped;
        for(let j = 0 ; j < i-1; j++){
            if(array[j] > array[j+1]){
                [array[j],array[j+1]] = [array[j+1],array[j]]
                isSwapped=true;
            }
        } if(!isSwapped){
            break;
        }

    }
    return array;
}
const result
 = bubbleSort([5,6,4,3,76,9,1])
console.log(result)