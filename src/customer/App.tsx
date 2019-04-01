import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useImClient } from './store';
import { observer, useObservable } from 'mobx-react-lite';

const AddressBook = lazy(() => import('./AddressBook'));
const ChatPanel = lazy(() => import('./ChatPanel'));

const App = observer(() => {
  const imClient = useImClient();

  const state = useObservable({
    started: false
  });

  useEffect(() => {
    imClient.startPromise &&
      imClient.startPromise.then(() => {
        state.started = true;
      });
  }, []);

  return (
    <_App>
      {state.started ? (
        <React.Fragment>
          <Suspense
            fallback={
              <_Unstarted>
                <Spinner label="正在加载组件" size={SpinnerSize.large} />
              </_Unstarted>
            }
          >
            <div>
              <AddressBook />
            </div>
            <div>
              <ChatPanel />
            </div>
          </Suspense>
        </React.Fragment>
      ) : (
        <_Unstarted>
          <Spinner label="正在登录" size={SpinnerSize.large} />
        </_Unstarted>
      )}
    </_App>
  );
});

const _App = styled.div`
  border: 1px #000 solid;
  border-radius: 4px;
  height: 590px;
  width: 800px;
  display: flex;

  > :nth-child(1) {
    flex: 1;
    border-right: solid 1px #dcdcdc;
  }
  > :nth-child(2) {
    flex: 2.5;
  }
`;

const _Unstarted = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  background-color: #fff;
  justify-content: center;
  align-items: center;
`;

export default App;
