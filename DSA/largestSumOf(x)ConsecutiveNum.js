//[1,2,3,4,3,5,4,6,7,8] -Total Elements => 10;
//Count largest Sum of consecutive Digits
//num => 4 { take first 4 Consecutive num Sum, then remove the array[0] and then take the next 4 numbers }
//sum => 25

//conditions:
//Number > array --> Error Message
//How many times the loop will run -->
// Total number of Elements - no. of Elements loops at once + 1
//10 - 4 + 1 =7 { in this case }

function findLargest(array, num){

    if(num > array){
        throw new Error("Number should not be greater than array");
    }else{
        let max =0;
        for(i=0; i<array.length - num +1 ;i++){
            let tmp = 0;
            for(let j=0;j<num;j++){
                
                tmp+=array[i+j];
            }
            if(tmp > max){
                max = tmp;
            }
        }
        return max;
    }
}

const result = findLargest([1,2,3,4,3,5,4,6,7,8] , 4)
console.log(result);