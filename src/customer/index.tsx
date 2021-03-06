import * as ReactDOM from 'react-dom';
import * as React from 'react';
import App from './App';
import { StoreContext, Store, BusContext, ImClientContext, GlobalConfig } from './store';
import { config as _config } from './config';
import { initializeIcons } from '@uifabric/icons';
import { toJS } from 'mobx';
import * as mobx from 'mobx';
import EventEmitter from 'wolfy87-eventemitter';
import { ImClient } from '@/common/im/ImClient';

initializeIcons();

export function render(
	config: GlobalConfig = (window as any).CUSTOMER_SERVICE_CONFIG || _config,
	elem: Element = document.getElementById('root')!
) {
	ReactDOM.unmountComponentAtNode(elem);
	if (config === _config) {
		config = { ..._config, url: _config.url + 1 };
	}
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
		(window as any).Im = ImClient;
		(window as any).mobx = mobx;

		imClient.bus.addListener('remind', (payload: any) => console.log('remind', toJS(payload)));
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

var renderBtn = document.getElementById('render')!;
var urlInput = document.getElementById('id')! as HTMLInputElement;

renderBtn.onclick = function() {
	if (urlInput.value) {
		render({
			url: _config.url + urlInput.value
		});
	} else {
		render();
	}
};
