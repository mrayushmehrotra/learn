/* 
 Count Subarray with k odds
 Difficulty: MediumAccuracy: 51.12%Submissions: 15K+Points: 4Average Time: 20m
 You are given an array arr[] of positive integers and an integer k. You have to count the number of subarrays that contain exactly k odd numbers.

 Examples:

 Input: arr[] = [2, 5, 6, 9], k = 2
 Output: 2
 explain: kitne sub-array's ban rhe hai, is ek array se including K(yaha pe 2) no. of odd numbers from the array.

*/

function countAtMostKOdds(arr, k) {
  let left = 0;
  let count = 0;
  let oddCount = 0;

  for (let right = 0; right < arr.length; right++) {
    if (arr[right] % 2 !== 0) oddCount++;

    while (oddCount > k) {
      if (arr[left] % 2 !== 0) oddCount--;
      left++;
    }

    count += right - left + 1;
  }

  return count;
}

function SubArrWithKOdd(arr, k) {
  return countAtMostKOdds(arr, k) - countAtMostKOdds(arr, k - 1);
}

const ans = SubArrWithKOdd([2, 2, 5, 6, 9, 2, 11], 2);
console.log(ans); // 2
