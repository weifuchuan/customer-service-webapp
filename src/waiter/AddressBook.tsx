import { AccountBaseInfo } from '@/common/im';
import clearAndSet from '@/common/kit/functions/clearAndSet';
import matchSorter from 'match-sorter';
import { autorun, action } from 'mobx';
import { observer, useObservable } from 'mobx-react-lite';
import { ISearchBoxProps } from 'office-ui-fabric-react/lib/SearchBox';
import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import ContactList from './ContactList';
import MyInfo from './MyInfo';
import { useStore, useImClient } from './store';

const AddressBook = observer(() => {
  const store = useStore();
  const imClient = useImClient();

  const state = useObservable({
    searchedCustomerList: [] as AccountBaseInfo[],
    searching: false
  });

  const onSelected = useCallback((account: AccountBaseInfo) => {
    store.currentContact = account;
  }, []);

  const searchBoxProps: ISearchBoxProps = {
    onChange: action((val: string) => {
      state.searching = true;
      val = val.trim();
      if (val) {
        clearAndSet(
          state.searchedCustomerList,
          ...matchSorter(imClient.accounts, val, {
            keys: [ 'nickName' ]
          })
        );
      } else {
        state.searching = false;
      }
    }),
    onClear: action(() => {
      state.searching = false;
    })
  };

  return (
    <_AddressBook>
      <div>
        <MyInfo
          nickName={imClient.me ? imClient.me.nickName : ''}
          avatar={imClient.me ? imClient.me.avatar : ''}
          searchBoxProps={searchBoxProps}
        />
      </div>
      <div>
        <ContactList
          accountList={(state.searching
            ? state.searchedCustomerList.slice()
            : imClient.accounts.slice()).map((account) => {
            return {
              ...account,
              lastMsgSendAt: imClient.otherIdToRoom.get(account.id)!.lastMsg
                .sendAt
            };
          })}
          selected={store.currentContact}
          onSelected={onSelected}
        />
      </div>
    </_AddressBook>
  );
});

const _AddressBook = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  > :nth-child(1) {
  }

  > :nth-child(2) {
    flex: 1;
  }
`;

export default AddressBook;
