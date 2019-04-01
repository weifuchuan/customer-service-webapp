import React, { useContext } from 'react';
import { AccountBaseInfo } from '@/common/im';
import { observable } from 'mobx';
import EventEmitter from 'wolfy87-eventemitter';
import { ImClient } from '@/common/im';

export const ImClientContext = React.createContext<ImClient>(null as any);

export const useImClient = () => useContext(ImClientContext);

export interface GlobalConfig {
  url: string;
  upload?: (image: File | Blob) => Promise<string>;
}

export class Store {
  @observable currentContact?: AccountBaseInfo;

  @observable config: GlobalConfig;

  constructor(config: GlobalConfig) {
    this.config = config;
  }
}

export const StoreContext = React.createContext<Store>(null as any);

export const useStore = () => useContext(StoreContext);

export const BusContext = React.createContext(new EventEmitter());

export const useBus = () => useContext(BusContext);
