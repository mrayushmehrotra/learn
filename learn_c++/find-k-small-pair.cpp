#include <iostream>
#include <queue>
using namespace std;

class Solution {
public:
  vector<vector<int>> kSmallestPair(vector<int> &arr1, vector<int> &arr2,
                                    int k) {
    vector<vector<int>> ans;
    if (arr1.empty() || arr2.empty() || k == 0)
      return ans;

    // Min-heap: (sum, (i, j))
    priority_queue<pair<int, pair<int, int>>, vector<pair<int, pair<int, int>>>,
                   greater<pair<int, pair<int, int>>>>
        minHeap;

    // Push first k pairs for arr1[i] with arr2[0]
    for (int i = 0; i < arr1.size() && i < k; i++) {
      minHeap.push({arr1[i] + arr2[0], {i, 0}});
    }

    // Extract k smallest pairs
    while (k-- > 0 && !minHeap.empty()) {
      auto top = minHeap.top();
      minHeap.pop();

      int i = top.second.first;
      int j = top.second.second;

      ans.push_back({arr1[i], arr2[j]});

      // Move to next element in arr2
      if (j + 1 < arr2.size()) {
        minHeap.push({arr1[i] + arr2[j + 1], {i, j + 1}});
      }
    }

    return ans;
  }
};
