const users = [{username: "Ayush Mehrotra", email: "eyeayusham@gmail.com"},
    {username:"abc", email:"abc@gmial.com"},
    {username: "xyz", email: "xyz@gmial.com"}
]

function isUserExist(array, value){

    for(let item of array){
        if(item['username'] === value){
            return true;
        }
    }
    return false;
}

const res = isUserExist(users, "abc");
console.log(res);

// Time Complexity=> Linear o(n);

//Global Linear Search -- 2nd Method

function globalLinearSearch(arr, key){
    let result = [];
    for(let i = 0; i<arr.length;i++){
        if(arr[i]['username'] === key){
            result.push(i)
        }
    }
    if(!result){
        return false & -1
    }
    return result
}

const results = globalLinearSearch(users, "xyz")
console.log(results);