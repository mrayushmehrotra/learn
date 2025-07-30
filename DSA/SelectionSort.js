/* In this the first value index[i] becomes the pointer value and it runs through Whole array
for finding the lesser value than the pointer 
if it founds the value lesser than the pointer value then those two values get swapped 
And Now the pointer moves on index[i+1] and runs the whole process again */
// pointer is fixed and it just alot a min value and swaps [pointer will move from index[0] to arr.length ]

function selectionSort(array){
    for(let i =0;i<array.length;i++){
    let min = i;
    for(let j = i+1; j<array.length;j++){
        if(array[j] < array[min]){
            min=j;
        }
    }
    if(i!==min){
        temp=array[i]
        array[i]=array[min];
        array[min]=temp;
    }
 }
 return array;
}

const res = selectionSort([0,2,34,55,3,90,6])
console.log(res);