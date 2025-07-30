function foo(num: number): any {
    if (num === 1) {
        console.log("base case hit");
    }
    console.log(num + foo(num - 1));
}

foo(5);
