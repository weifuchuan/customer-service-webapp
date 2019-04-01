import * as ReactDOM from 'react-dom';
import * as React from 'react';
import App from './App';
import {
  StoreContext,
  Store,
  BusContext,
  ImClientContext,
  GlobalConfig
} from './store';
import { config as _config } from './config';
import { initializeIcons } from '@uifabric/icons';
import { toJS } from 'mobx';
import EventEmitter from 'wolfy87-eventemitter';
import { ImClient } from '@/common/im/ImClient';

initializeIcons();

export function render(
  config: GlobalConfig = (window as any).CUSTOMER_SERVICE_CONFIG || _config,
  elem: Element = document.getElementById('root')!
) {
  ReactDOM.unmountComponentAtNode(elem);

  const store = new Store(config);
  const imClient = new ImClient({
    url: config.url,
    role: 'customer'
  });
  imClient.start();
  if (__DEV__) {
    (window as any).store = store;
    (window as any).toJS = toJS;
    (window as any).im = imClient;

    imClient.bus.addListener('remind', (payload: any) =>
      console.log('remind', toJS(payload))
    );
  }

  ReactDOM.render(
    <StoreContext.Provider value={store}>
      <ImClientContext.Provider value={imClient}>
        <BusContext.Provider value={new EventEmitter()}>
          <App />
        </BusContext.Provider>
      </ImClientContext.Provider>
    </StoreContext.Provider>,
    elem
  );
}

render();

// @ts-ignore
window.render = render;
