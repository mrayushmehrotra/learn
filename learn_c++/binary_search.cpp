#include <iostream>
#include <vector>
using namespace std;

// Correct function signature
int runBinarySearch(const vector<int> &arr, int needle) {
  int min = 0;
  int max = arr.size() - 1;

  while (min <= max) {
    // (min + max) / 2 already rounds down in integer division
    int mid = min + (max - min) / 2;

    if (arr[mid] < needle) {
      min = mid + 1; // move right
    } else if (arr[mid] > needle) {
      max = mid - 1; // move left
    } else {
      return mid; // found
    }
  }

  return -1; // not found
}

int main() {
  vector<int> arr = {1, 3, 5, 7, 9, 11};
  int needle;
  cout << "Enter number to search: 1, 3, 5, 7, 9, 11 ";
  cin >> needle;

  int index = runBinarySearch(arr, needle);

  if (index != -1)
    cout << "Found at index " << index << endl;
  else
    cout << "Not found" << endl;

  return 0;
}
