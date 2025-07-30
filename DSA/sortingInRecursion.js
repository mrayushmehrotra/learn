// Sorting using recursion function
// [2,3,1,4] -> Default Case;
// if first num > second num then just move if not then swapped
// !if [2,1,3,4] -> first case
// again repeat the same function 
// !if [1,2,3,4] -> second case { final Output }

let myArray = [6,9,5,8,7,2,3,1,4]
let i = 0;
let j =1;
let myNewList = [];

function isSorted(array){
    for(let i =0;i<array.length;i++){
        if(array[i] > array[i+1]){
            return false;
        }
    }
    return true;
}

function sortCheck(array){
    if(isSorted(array)){
        myNewList =array;
        return ;
    }
    else if(array[i] < array[j]){
        i++;
        j++;
        sortCheck(array);
    } else {
        [array[i], array[j]] = [array[j], array[i]]
        i=0;
        j=1;
        sortCheck(array)
    }
}

sortCheck(myArray);
console.log(myNewList);