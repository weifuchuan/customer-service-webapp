import React, { useContext } from 'react';
import { Im, AccountBaseInfo } from '@/common/im';
import { observable } from 'mobx';
import EventEmitter from 'wolfy87-eventemitter'; 

export const ImContext = React.createContext<Im>(null as any);

export const useIm = () => useContext(ImContext);

export class Store {
  @observable currentContact?: AccountBaseInfo;
}

export const StoreContext = React.createContext(new Store());

export const useStore = () => useContext(StoreContext);

export const BusContext=React.createContext(new EventEmitter()) ;

export const useBus = () => useContext(BusContext);