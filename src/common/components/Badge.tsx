import React from 'react';
import styled from 'styled-components'; 

export default function Badge({
  count,
  className
}: {
  count: number;
  className?: string;
}) {
  if (count)
    return (
      <_Badge className={className}>
        <span>未读</span>
      </_Badge>
    );
  return null;
}

const _Badge = styled.div`
  background-color: #FF4500;
  display: inline-block;
  min-width: 10px;
  padding: .25em .625em;
  font-size: 0.3rem; 
  color: #fff;
  line-height: 1;
  vertical-align: baseline;
  white-space: nowrap;
  text-align: center; 
  border-radius: 0;
`;
