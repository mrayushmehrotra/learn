class Person {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  introduce(): void {
    console.log(`Hi, I'm ${this.name} and I'm ${this.age} years old.`);
  }
}

const p1 = new Person("Ayush", 22);
p1.introduce();

class BankAccount {
  public accountHolder: string; // Accessible everywhere
  private balance: number; // Accessible only inside the class
  protected interestRate: number; // Accessible in this and child classes

  constructor(accountHolder: string, balance: number, interestRate: number) {
    this.accountHolder = accountHolder;
    this.balance = balance;
    this.interestRate = interestRate;
  }

  public deposit(amount: number) {
    this.balance += amount;
  }

  public getBalance(): number {
    return this.balance; // OK (inside class)
  }
}

const acc = new BankAccount("Elliot", 1000, 5);
acc.deposit(500);
console.log(acc.accountHolder); // ✅ OK
// console.log(acc.balance); ❌ Error: private

class Employee extends Person {
  jobTitle: string;

  constructor(name: string, age: number, jobTitle: string) {
    super(name, age); // Calls Person constructor
    this.jobTitle = jobTitle;
  }

  override introduce(): void {
    // Override parent method
    console.log(`Hi, I'm ${this.name}, a ${this.jobTitle}.`);
  }
}

const dev = new Employee("Ayush", 22, "Software Engineer");
dev.introduce(); // "Hi, I'm Ayush, a Software Engineer."

class Animal {
  speak(): void {
    console.log("Some generic sound");
  }
}

class Dog extends Animal {
  override speak(): void {
    console.log("Woof! 🐶");
  }
}

class Cat extends Animal {
  override speak(): void {
    console.log("Meow! 🐱");
  }
}

const animals: Animal[] = [new Dog(), new Cat(), new Animal()];
animals.forEach((a) => a.speak());

abstract class Shape {
  abstract area(): number; // Must be implemented in child
  describe(): void {
    console.log("This is a shape.");
  }
}

class Circle extends Shape {
  constructor(public radius: number) {
    super();
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }
}

const c = new Circle(10);
c.describe();
console.log(c.area());

interface Flyable {
  fly(): void;
}

class Bird implements Flyable {
  fly() {
    console.log("Bird is flying");
  }
}

class Student {
  private _grade: number = 0;

  get grade(): number {
    return this._grade;
  }

  set grade(value: number) {
    if (value < 0 || value > 100) {
      throw new Error("Invalid grade!");
    }
    this._grade = value;
  }
}

const s = new Student();
s.grade = 90; // invokes setter
console.log(s.grade); // invokes getter

class MathUtil {
  static PI = 3.14159;

  static add(a: number, b: number): number {
    return a + b;
  }
}

console.log(MathUtil.PI);
console.log(MathUtil.add(5, 10));

