
var isPalindrome = function(x){
    const arr = [];
    if (x < 0 ){
        return false;
    }
    while(x > 0){
        arr.push(x%10);
        x = Math.floor(x/10);
    }

    for(let i = 0 ;i <arr.length; i++){
        if(arr[i] !== arr[arr.length -1 -i]){
            return false
        }
    }
    return true
}
//       isPlaindrome by Technical Suneja

//Case 1  by using default function
const isPalind = (stri) =>  {

    let reverse = stri.split("").reverse().join("")

    return stri.toLowerCase() === reverse.toLowerCase();
}

////console.log(isPalind("leuvel"))

//Case 2 by not using default functions

const isPalindr = (str) => {
    let newStr = str.toLowerCase();

    let left  = 0;
    let right = newStr.length - 1;
    while (left < right){
        if(newStr[left] !== newStr[right]){
            return false
        } else {
            return true
        }
    }
} 
const res = isPalindr("dalda")
console.log(res);


   //Practice and correct by inbuilt functions
const isPal = (str) => {

    const level0 = str.toLowerCase();
    console.log("string goes from this-->", str ,"to this -->", level0)
    const level1 = level0.split("")
    console.log(level1);
    const level2 = level1.reverse();
    console.log(level2);
    const level3 = level2.join("")
    console.log(level3)
    if(level0 === level3){
        return true
    } else {
        return false
    }
}

//// const res = isPal("Level")
//// console.log(res)