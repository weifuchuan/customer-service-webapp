
export default function log(...args:any[]){
  if(__DEV__){
    console.log(...args);
  }
}