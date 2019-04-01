import { FunctionComponent } from 'react';
import Scrollbars, { ScrollbarProps } from 'react-custom-scrollbars';
import React from 'react';

const Scrollable: FunctionComponent<
  ScrollbarProps & {
    scrollbarsRef?: (instance: Scrollbars | null) => void;
  }
> = ({ children, scrollbarsRef, ...props }) => {
  return (
    <Scrollbars
      autoHide
      autoHideTimeout={1000}
      autoHideDuration={200}
      ref={(instance) => scrollbarsRef&&scrollbarsRef(instance)}
      {...props}
    >
      {children}
    </Scrollbars>
  );
};

export default Scrollable;
