#include <iostream>
#include <queue>
#include <vector>
using namespace std;

class Solution {
public:
  int minOperations(vector<int> &arr) {
    priority_queue<double> pq;
    double sum = 0;

    // Push all elements to the max heap and compute total sum
    for (int x : arr) {
      sum += x;
      pq.push(x);
    }

    double target = sum / 2.0; // Our goal is to reduce the sum to half
    int ops = 0;               // Operation count

    // Continue halving largest element until sum <= half
    while (sum > target) {
      double largest = pq.top();
      cout << largest << "Largest COUNT" << endl;

      pq.pop();

      double half = largest / 2.0;
      sum -=
          half; // We reduce the sum by half (largest - half = half reduction)
      cout << half << "half COUNT" << endl;
      pq.push(half); // Push the halved value back to heap
      ops++;         // Count the operation
      cout << ops << " OPS COUNT" << endl;
    }

    return ops;
  }
};

int main() {
  vector<int> arr = {5, 19, 8, 1};
  Solution s;
  cout << "Minimum operations required: " << s.minOperations(arr) << endl;
  return 0;
}
