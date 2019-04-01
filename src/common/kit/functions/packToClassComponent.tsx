import * as React from "react";

export function packToClassComponent<P>(C: React.FunctionComponent<P>) {
  return class extends React.Component<P> {
    render(): React.ReactNode {
      return <C {...this.props} />;
    }
  };
}