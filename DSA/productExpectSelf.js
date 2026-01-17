function productExpectSelf(arr) {
  const ans = new Array(arr.length).fill(1);

  prefix = 1;
  for (let i = 0; i < arr.length; i++) {
    ans[i] = prefix;
    prefix *= arr[i];
  }

  postfix = 1;

  for (let j = arr.length - 1; j >= 0; j--) {
    ans[j] *= postfix;
    postfix *= arr[j];
  }

  return ans;
}

const ans = productExpectSelf([1, 2, 3, 4]);
console.log(ans);
