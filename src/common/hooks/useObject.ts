import React, { useState } from "react";

export default function useObject<T>(obj:T){
  const [o]=useState(obj);
  return o;
}