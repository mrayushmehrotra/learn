//  //Count Unique Numbers
//  //   i j  
//  //[1,1,2,2,3,4,5,5,6,7,7,8]
//  //Ans->8
//  //conditions:
//  //Array should have to be sorted before putting the value
//  //i=0, j=1
//  //array[i] !== array[j]
//  //1. i++
//  //2. array[i] = array[j]]

//  function countUnique(array){
//     if(array.length>0){
//         let i = 0;
//         for(let j=1; j<array.length; j++){
//             if(array[i] !== array[j]){
//                 i++;
//                 array[i] = array[j]
//             }

//         }
//         return i+1;
//     } else {
//         throw new Error ("Array is Empty");
//     }
//  }

//  const result = countUnique([1,1,2,2,3,4,5,5,6,7,7,8]);
//  console.log(result);

//  //o(n) Linear Time Complexity 

// Practice --->

function getUnique(arr){
    if (arr.length>0){
        let i =0;
        for(let j=1; j<arr.length;j++){
            if(arr[i] !== arr[j]){
                i++;
                arr[i]= arr[j];
            }
        }
        return i +1;
    } else {
        throw new Error ("Array is empty");
    }
}
const result = getUnique([1,1,2,2,3,4,5,5,6,7,7,8]);
  console.log(result);
