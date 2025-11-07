import Print from "./component/auth";
const App = () => {
  const { sayError, sayHi } = Print();
  sayError();
  sayHi();
  return <div></div>;
};

export default App;
