import * as ReactDOM from 'react-dom';
import * as React from 'react';
import App from './App'; 
import { ImContext, StoreContext, Store, BusContext } from './store';
import { Im } from '@/common/im';
import { config as _config } from './config';
import { initializeIcons } from '@uifabric/icons';
import { toJS } from 'mobx';
import EventEmitter from 'wolfy87-eventemitter'; 
initializeIcons();

function render(__config?: typeof _config) {
  const config: typeof _config =
    __config || (window as any).CUSTOMER_SERVICE_CONFIG || _config;

  ReactDOM.unmountComponentAtNode(document.getElementById('root')!);

  const store = new Store();
  const im = new Im(config.url, 'waiter');
  if (__DEV__) {
    (window as any).store = store;
    (window as any).im = im;
    (window as any).toJS = toJS; 

    im.bus.addListener("remind",(payload:any)=>console.log("remind", toJS(payload))); 
  }

  ReactDOM.render(
    <StoreContext.Provider value={store}>
      <ImContext.Provider value={im}>
        <BusContext.Provider value={new EventEmitter()} >
          <App />
        </BusContext.Provider>
      </ImContext.Provider>
    </StoreContext.Provider>,
    document.getElementById("root")
  );
}

render();

// @ts-ignore
window.render=render;
