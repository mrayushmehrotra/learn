function Print() {
  function sayHi() {
    console.log("Say HI");
  }

  function sayError() {
    console.error("Say error");
  }

  return { sayHi, sayError };
}

export default Print;
