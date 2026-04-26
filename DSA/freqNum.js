//
// class Solution {
//     /**
//      * @param {number[]} nums
//      * @param {number} k
//      * @return {number[]}
//      */
// }

const ar1 = [1, 2, 3, 4, 5, 2, 2];
function checkFreqNum(arr) {
  const meowMap = {};

  for (let i = 0; i < ar1.length; i++) {
    meowMap[ar1[i]] = meowMap[arr[i]] ? meowMap[arr[i]] + 1 : 1;
  }
  var maxAns = Math.max(...Object.values(meowMap));
  console.log(maxAns);
  const ans = Object.keys(meowMap).find((key) => {
    return meowMap[key] === maxAns;
  });
  console.log(ans);
}

checkFreqNum(ar1);
