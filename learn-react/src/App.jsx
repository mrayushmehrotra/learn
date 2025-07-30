import React from "react";

const ReturnComponentWithExtraProps = (WrapperComponent) => {
  const thisIsSomthingSecretFromOne = "you have nice d";
  return function ImNotGayToReturnAnotherFunction(props) {
    return (
      <WrapperComponent
        {...props}
        somethingSecret={thisIsSomthingSecretFromOne}
      />
    );
  };
};

const Card = ({ props, somethingSecret }) => {
  return (
    <div>
      <br />
      thisis from the props {props}
      <br />
      {somethingSecret}
    </div>
  );
};

const ExtraWrapperThatIsNotNecessary = ReturnComponentWithExtraProps(Card);

const App = () => {
  const bokachoda = "Some bokachoda";
  return (
    <div>
      <ExtraWrapperThatIsNotNecessary props={bokachoda} />
    </div>
  );
};

export default App;
