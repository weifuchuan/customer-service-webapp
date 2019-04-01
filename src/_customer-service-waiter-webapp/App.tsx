import styled from 'styled-components';
import React, { useContext, useEffect } from 'react';
import AddressBook from './AddressBook';
import colors from '@/common/styles/colors';
import ChatPanel from './ChatPanel';
import { StoreContext, ImContext } from './store';
import repeat from '@/common/kit/functions/repeat';

export default function App() {
  const store = useContext(StoreContext);
  const im = useContext(ImContext);

  useEffect(()=>{
    repeat(()=>{
      if(!im.connected&&im.connnectError){
        return true; 
      }else if(im.connected&&!im.connnectError) {
        
        return true; 
      }
      return false;
    }); 
  },[]); 

  return (
    <_App>
      <div>
        <AddressBook />
      </div>
      <div>
        <ChatPanel />
      </div>
    </_App>
  );
}

const _App = styled.div`
  border: 1px #000 solid;
  border-radius: 4px;
  height: 590px;
  width: 800px;
  display: flex;

  > :nth-child(1) {
    flex: 1;
    border-right: solid 1px #DCDCDC;
  }
  > :nth-child(2) {
    flex: 2.5;
  }
`;
