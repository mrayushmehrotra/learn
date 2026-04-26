// Given two sorted arrays a[] and b[], where each array may contain duplicate elements, return the elements in the intersection of the two arrays in sorted order.
//
// Note: Intersection of two arrays can be defined as the set containing distinct common elements that are present in both of the arrays.
//
// Examples:
//
// Input: a[] = [1, 1, 2, 2, 2, 4], b[] = [2, 2, 4, 4]
// Output: [2, 4]
// if not match then return []
// Explanation: Distinct common elements in both the arrays are: 2 and 4.
//

// function checkInt(a, b) {
//   counter = {};
//
//   for (let i = 0; i < a.length; i++) {
//     counter[a[i]] = counter[a[i]] ? counter[a[i]] + 1 : 1;
//   }
//   const arr = [];
//
//   for (nums in b) {
//     counter[b[nums]] = arr.push(counter[b[nums]]);
//   }
//   console.log(arr);
// }
//
// checkInt([1, 1, 2, 2, 2, 4], [2, 2, 4, 4]);

function checkIn(a, b) {
  return [...new Set(a.filter((val) => b.includes(val)))];
}
const ans = checkIn([1, 1, 2, 2, 2, 4], [2, 2, 4, 4]);
console.log(ans);
