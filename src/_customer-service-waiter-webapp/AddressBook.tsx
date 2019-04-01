import styled from 'styled-components';
import React, { useContext, useCallback, useEffect } from 'react';
import colors from '@/common/styles/colors';
import MyInfo from './MyInfo';
import { ImContext, StoreContext } from './store';
import { observer, useObservable } from 'mobx-react-lite';
import ContactList from './ContactList';
import { AccountBaseInfo } from '@/common/im';
import { autorun, toJS } from 'mobx';
import { ISearchBoxProps } from 'office-ui-fabric-react/lib/SearchBox';
import matchSorter from 'match-sorter';
import clearAndSet from '@/common/kit/functions/clearAndSet';

const AddressBook = observer(() => {
  const store = useContext(StoreContext);
  const im = useContext(ImContext);

  const state = useObservable({
    searchedCustomerList: [] as AccountBaseInfo[],
    searching: false
  });

  const onSelected = useCallback((account: AccountBaseInfo) => {
    store.currentContact = account;
  }, []);

  const searchBoxProps: ISearchBoxProps = {
    onChange: useCallback((val) => {
      state.searching = true; 
      val = val.trim();
      if (val) {
        clearAndSet(
          state.searchedCustomerList,
          ...matchSorter(im.store.accountList, val, {
            keys: [ 'nickName' ]
          })
        );
      } else {
        state.searching = false;
      }
    }, []),
    onClear: useCallback(() => {
      state.searching = false;
    }, [])
  };

  useEffect(() => {
    const disposer = autorun(() => {});
  }, []);

  return (
    <_AddressBook>
      <div>
        <MyInfo
          nickName={im.store.me ? im.store.me.nickName : ''}
          avatar={im.store.me ? im.store.me.avatar : ''}
          searchBoxProps={searchBoxProps}
        />
      </div>
      <div>
        <ContactList
          accountList={(state.searching
            ? state.searchedCustomerList.slice()
            : im.store.roomInfoList            
                .map(
                  (room) =>
                    im.store.idToAccount.get(
                      room.members.filter((m) => m !== im.store.me!.id)[0]
                    ) || ({} as AccountBaseInfo)
                )
                .filter((x) => !!x.id)).map((account) => {
            return {
              ...account,
              lastMsgSendAt: im.store.idToLastMsgSendAt.get(account.id)!
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
