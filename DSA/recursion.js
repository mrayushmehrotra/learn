//Recursion : When function call itself
// otherwise it will get called for infinite Times
// if a function call itself then there must be an end point

let counter  = 1;
function hang(number){ //defined fucntion

    if(counter > number){
        return;
    }

    console.log("Bhadwe" + counter);
    counter++;
    hang(number); //recursion function
} //function demo(number) 
hang(9); //being called 9 times