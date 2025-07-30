function fizz_buzz(num) {
  for (let i = 0; i < num.length; i++) {
    if (num[i] % 3 === 0) {
      num[i] = "Fizz";
    }
    if (num[i] % 5 === 0) {
      num[i] = "Buzz";
    }
    if (num[i] % 3 === 0 && num[i] % 5 === 0) {
      num[i] === "FizzBuzz";
    }
  }
  console.log(num);
}
fizz_buzz([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
