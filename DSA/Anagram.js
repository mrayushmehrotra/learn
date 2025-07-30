// String Anagram
// "hello" -> "llloo"  //false anagram
//"hello" -> "lleoh" //True Anagram


//1.condition 1 Strings should contain a same number of letter ,
//(agar ye equal nhi hai to False Anagram (anagram nhi hai));
function isAnagram(string1, string2){
    if(string1.lenght !==string2.lenght){
        return ("Not Anagram", false);
    }

    
    //2.if no. of length of string is same and the letters also then the string is anagram
    //"hello" -> "lleoh" //True Anagram
    let counter = {}
    for(let letter of string1){
       counter[letter] = (counter[letter] || 0 ) + 1;
       console.log(counter[letter]);
    }
    console.log(counter);

    for(let items of string2){
        if(!counter[items]){
            return false;
        }        
        counter[items] -= 1;

    }
    return true;
}


const check = isAnagram("hello", "lloeh")
console.log(check);
