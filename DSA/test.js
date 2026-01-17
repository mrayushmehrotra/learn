// const arr = [100, "q", 20, "ayush", "x"];
//
// const str = [];
// const nums = [];
// const chars = [];
//
// function pushData() {
//   arr.map((item) => {
//     if (typeof item === "string" && item.length === 1) {
//       // it means the item is char
//       chars.push(item);
//     } else if (typeof item === "string" && item.length !== 1) {
//       str.push(item);
//     } else {
//       nums.push(item);
//     }
//   });
// }
//
// pushData();
// console.log("str", str);
// console.log("char", chars);
// console.log("nums", nums);
//
//
// ############## splice and slice

// const arr = [1, 2, 3, 4, 5];
// const newArr = arr.slice(1, 3);
// const spliceArr = arr.splice(1, 3); removes out bound arr upto index 1 to 3 [2,3,4] from the real array
// console.log("spliceArr", spliceArr);
// console.log(arr);
// console.log("newArr", newArr);

// ################## find and filter
//
// const arr = [1, 2, 3, 4, 5];
//
// const reutnrVal = arr.find((item) => item > 2);
// console.log("reutnrVal", reutnrVal); don't use => {} this bracket in callback return your data will be undefined
//
// const returnVal = arr.filter((item) => item > 2);
// console.log("reutnrVal", returnVal);
//
//
// #### merge 2 obj

// const obj1 = {
//   a: "ayush",
// };
// const obj2 = {
//   b: "mehrotra",
// };
//
// const obj3 = { ...obj1, ...obj2 }; // obj3 { a: 'ayush', b: 'mehrotra' }
// const oobj3 = { obj1, obj2 }; // obj3 { a: 'ayush', b: 'mehrotra' }
// console.log("obj3", obj3);
// console.log("obj3", oobj3); // obj3 { obj1: { a: 'ayush' }, obj2: { b: 'mehrotra' } }

// const obj1 = {};
// const obj2 = {
//   name: "ayush",
// };
// const obj3 = {
//   name: "mehrotra",
// };
//
// // yes this is correct "[object Object]" this is the key from obj1 which will only overwritten by objects
// // the Object will convert as js stops us from putting object as keys in the object so it will be converted like this "Object": "akash"
// // "Object": "mehra"
// //
// obj1[obj2] = {
//   name: "akash",
// };
//
// // obj1[obj3] = {
// //   name: "mehra",
// // };
//
// console.log(obj1[obj3]); // why mehra is the answer
//
//
// ########## write a single sum function to sum (8,9) and sum(8)(9)

// function sum(a) {
//   return function (b) {};
// }

// // check if obj can store freq from array
// const arr = [1, 2, 4, 4, 5, 6, 1, 2];
// const counter = {};
// for (var i = 0; i < arr.length; i++) {
//   counter[arr[i]] = counter[arr[i]] + 1 || 1;
// }
// console.log(counter);
//
//
// loop in a string
//
// const ayush = "ayush";
// for (let i = 0; i < ayush.length; i++) {
//   console.log(ayush[i]);
// }

// Two Sum optimised approached
//

// function twoSumHashMap(arr, sum) {
//   const hashMap = new Map();
//   for (let i = 0; i < arr.length; i++) {
//     target = sum - arr[i];
//     if (hashMap.has(target)) {
//       return [hashMap.get(target), i];
//     }
//     hashMap.set(arr[i], i);
//   }
// }

// function twoSumHashMapObj(arr, sum) {
//   const prevMap = {};
//   for (let i = 0; i < arr.length; i++) {
//     target = sum - arr[i];
//     if (prevMap[target] !== undefined) {
//       return [prevMap[target], i];
//     }
//     prevMap[arr[i]] = i;
//   }
// }

// // const data = twoSumHashMapObj([5, 3, 1, 4], 4);
// // console.log("data", data);
// //
// // THREE SUM
// //
// // [1,2,3,4,5,0,-1] i j k sum should return 0
// function threeSum(arr) {
//   var a = 0;
//   const myarr = [];
//   for (let i = 1; i < arr.length; i++) {
//     for (let j = 2; j < arr.length; j++) {
//       if (arr[a] + arr[i] + arr[j] === 0) {
//         myarr.push([arr[a] + arr[i] + arr[j]]);
//       }
//     }
//   }
//   console.log(myarr);
//   return myarr;
// }
// threeSum([1, 2, 3, 4, 5, 0, -1]);

// const arr = [1, 2, 4, 5, 6, 1, 2];
// const counter = {};
// const ecounter = { 1: 2, 2: 2, 4: 1, 5: 1, 6: 1 };
//
// for (var i = 0; i < arr.length; i++) {
//   counter[arr[i]] = counter[arr[i]] + 1 || 1;
// }
// console.log(counter);
// console.log("check wala", counter === ecounter);
