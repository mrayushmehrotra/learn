/**
 * @param {number[]} prices
 * @return {number}
 */

// var maxProfit = function (prices) {
//   var [l, r] = [0, 1];
//   let ismax = 0;
//   while (r < prices.length) {
//     console.log("current prices length", prices.length);
//     if (prices[l] < prices[r]) {
//       profit = prices[r] - prices[l];
//       console.log("ismax, profit)", ismax, profit);
//       ismax = Math.max(ismax, profit);
//       console.log("r", r);
//     } else {
//       l = r;
//     }
//     r++;
//   }
//   return ismax;
// };

const maxProfit = (arr) => {
  var [l, r] = [0, 1];
  let maxP = 0;

  while (r < arr.length) {
    if (arr[l] < arr[r]) {
      profit = arr[r] - arr[l];
      maxP = Math.max(profit, maxP);
    } else {
      l = r;
    }
    r++;
  }
  return maxP;
};
const ans = maxProfit([7, 1, 5, 3, 6, 4]);
console.log(ans);
