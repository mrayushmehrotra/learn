#include <iostream>
using namespace std;

void inc(int &a, int b) {
  a++;
  b++;
  cout << a << " ye aage B aa gaya inc me se " << b << endl;
}

int main() {
  int a = 3;
  int b = 5;

  cout << "CUrrent value in main" << a << b << endl;
  inc(a, b);

  cout << "after value in main" << a << "" << b << endl;
}
