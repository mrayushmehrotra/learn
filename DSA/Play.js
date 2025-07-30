// const obj = {
//   name: "Aysuh",
//   age: 21,
// };
//
// const obj1 = {
//   ...obj,
//   age: 33,
// };
//
// console.log("obj1", obj1);
// the ...obj will add all the properties of obj to obj1 and other's will be replaced
//
// {
// name: "Ayush",
// age: 33 // now 21 is replaced by 33
// }
//
//

// ---------------------------------------------------------------------------------------------------------------------

// const obj = {
//   name: "Aysuh",
//   age: 21,
// };
//
// const obj1 = {
//   name: obj.name,
//   age: 33,
// };
// console.log("obj1", obj1);

// works normally obj1 takes the obj.name property == "Ayush" and now age will be 33
//
//

// ---------------------------------------------------------------------------------------------------------------------
//
//
console.log(1 + "2" + "2");
// 122
console.log(1 + +"2" + "2");
//32
console.log(1 + -"1" + "2");
// 02
console.log(+"1" + "1" + "2");
//112
console.log("A" - "B" + "2");
//NaN2
console.log("A" - "B" + 2);
//NaN

function test() {
  console.log(a);
  var a = 5;
}
test();
// "undefined" function ke andar hai to kya ho gaya gandu? hai to pehlle log then var declare hi na
//

// for (var i = 0; i < 3; i++) {
//   setTimeout(() => console.log(i), 1000);
// }

//print's three time three because var is function scoped for loop run's three times
//with three settimeout and store's the var value to to 3 then print's 3 three times after 3 seconds
//

// for (let i = 0; i < 3; i++) {
//   setTimeout(() => console.log(i), 1000);
// }
// this will print 1 2 3 because they all will be scoped within // ASK?

// let obj = { a: 1 };
// const copy = obj;
// copy.a = 5;
// console.log(obj.a);
// why 5 explain plz
//
//

// console.log([] + []); // ?
// console.log([] + {}); // ?
// console.log({} + []); // ?
// console.log({} + {}); // ?
// explain this all elaborately
// [object Object]
// [object Object]
// [object Object][object Object]
// my answer is this from the browser console

const a = {};
const b = { key: "b" };
const c = { key: "c" };

a[b] = 123;
a[c] = 456;

console.log(a[b]);
// explain what's going on behind the hood

async function async1() {
  console.log("1");
  await async2();
  console.log("2");
}
async function async2() {
  console.log("3");
}
console.log("4");
async1();
console.log("5");

// 4 1 3 5 2
//
// why 5 comes before 2 ?
