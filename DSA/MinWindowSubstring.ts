class Solution {
  minWindow(s1: string, s2: string) {
    let counter = {};
    for (let j = 0; j < s2.length; j++) {
      counter[s2[j]] = counter[s2[j]] + 1 || 1;
    }
    console.log("Counter before matching", counter);
    for (let i = 0; i < s1.length; i++) {
      counter;
    }
  }
}

const Sol = new Solution();
Sol.minWindow("geekforgeek", "forg");
