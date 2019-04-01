import React from 'react';
import {
  SearchBox,
  ISearchBoxProps
} from 'office-ui-fabric-react/lib/SearchBox';
import styled from 'styled-components';
import colors from '@/common/styles/colors';
import Avatar from '@/common/components/Avatar';

interface MyInfoProps {
  nickName: string;
  avatar: string;
  searchBoxProps?: ISearchBoxProps;
}

const MyInfo = ({ nickName, avatar, searchBoxProps }: MyInfoProps) => {
  return (
    <_MyInfo>
      <div>
        <div>
          <Avatar
            src={avatar}
            // imageFit={ImageFit.center}
            width={50}
            height={50}
          />
        </div>
        <div>
          <span>{nickName}</span>
          <span>客服端</span>
        </div>
      </div>
      <div>
        <SearchBox placeholder="搜索最近联系人" {...searchBoxProps} />
      </div>
    </_MyInfo>
  );
};

const _MyInfo = styled.div`
  background-color: ${colors.OrangeRed};
  padding: 0.8rem;

  > div:nth-child(1) {
    margin: 0 0 1rem 0;
    color: #fff;
    display: flex;

    > div:nth-child(2) {
      margin: 0 0 0 1rem;
      display: flex;
      flex-direction: column;
      > span:nth-child(1) {
        font-size: 1.5rem;
      }
      > span:nth-child(2) {
        font-size: 1rem;
        color: ${colors.Gainsboro};
      }
    }
  }
`;

export default MyInfo;
