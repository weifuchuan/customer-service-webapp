import { GlobalConfig } from './store';

export const config: GlobalConfig = {
  url: __DEV__ ? 'ws://127.0.0.1:7777?id=1' : 'ws://123.207.28.107:7777?id=1'
};
