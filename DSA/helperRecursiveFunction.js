//Helper Recursive function
//[1,2,3,4,5,6,7,8,9,10]
// [1,3,5,7,9] --> output only odd numbers
// number%2 !== 0


function findOdd(array) {
    let result = [];

    function helperRecursiveFunction(inputArray) {
        if(inputArray.length === 0){
            return;
        } if (inputArray[0] %2 !== 0 ){
            result.push(inputArray[0])
        }
        helperRecursiveFunction(inputArray.slice(1))

        
    }
    helperRecursiveFunction(array); //first time calling
    return result;
}

const res = findOdd([1,2,3,4,5,6,7,8,9,10,11]);
console.log(res);
