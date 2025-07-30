function getSumPairZero(array){
    for(let number of array){
        for(let i=0; i<array.length; i++){
            if (number + array[i]===0){
                return [number,array[i]];
            }
        }
    }
}

const result=getSumPairZero([-5,-4,-3,-2,0,2,3,4,6,8]);
console.log(result);

// time o(n^2)  Quadratic time complexity

// function twoSum(nums, target){
//     for(numbers of nums){
//         for(let i=0 ; i<nums.length; i++){
//             if(numbers + nums[i] === target){
//                 return (numbers + nums[i])
                
                
//             }
//         }
//     }
// }

// nums = [2,7,11,15],
// target = 9
// const result = twoSum(nums, target);
// console.log(result);

// var twoSum = function(nums, target) {
//     var out1 = 0;
//     var out2 = 1;
//     var correct = (nums[out1]+nums[out2] == target);
//     function check() {
//         try {
//             while ((nums[out1]+nums[out2] == target) == false) {
//                 out1 = Math.round(Math.random()*nums.length);
//                 out2 = Math.round(Math.random()*nums.length);
//                 correct = (nums[out1]+nums[out2] == target);
//             }
//             if (out1 == out2) {
//                 twoSum(nums, target);
//             } else {
//                 return;
//             }
//         } catch {
//             twoSum(nums, target);
//         }
//     }
//     check();
//     if (out1==out2) {
//         return twoSum(nums, target);
//     } else {
//         return [out1, out2];
//     }
// };