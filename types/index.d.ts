import Wolfy87EventEmitter from 'wolfy87-eventemitter';
 

declare global { 
  const __DEV__: boolean;

  const bus: EventEmitter;
  
  type EventEmitter = Wolfy87EventEmitter;
}
