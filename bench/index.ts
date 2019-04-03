// @ts-ignore
global.__DEV__ = true;

import { ImClient } from "../src/common/im";
import WebSocket from "ws";

const log = require("single-line-log").stdout;

const imClientList: ImClient[] = [];

const clientCount = 200;

const waiterIdList = ["1008601", "1008602", "1008603"];

const waiterList: ImClient[] = [];

for (let i = 1; i <= clientCount; i++) {
  imClientList.push(
    new ImClient({ url: "ws://127.0.0.1:7777?id=" + i, role: "customer" }, {
      makeWebSocket: (url: string) => {
        return new WebSocket(url);
      }
    } as any)
  );
}

for (const id of waiterIdList) {
  waiterList.push(
    new ImClient({ url: "ws://127.0.0.1:7777?id=" + id, role: "waiter" }, {
      makeWebSocket: (url: string) => {
        return new WebSocket(url);
      }
    } as any)
  );
}

(async () => {
  console.log(`starting...`);

  let iter = imClientList.values();
  for (let j = 0; j < clientCount;) {
    const arr = [];
    for (let i = 0; i < 50; i++) {
      const cli = iter.next();
      if (cli.done) break;
      j++;
      cli.value.start();
      arr.push(cli.value.startPromise);
    }
    await Promise.all(arr);
    log(`started ${j} clients`)
  }

  // for (const cli of imClientList) {
  //   cli.start();
  // }

  for (const cli of waiterList) {
    await cli.start();
  }

  // await Promise.all(imClientList.concat(waiterList).map(cli => cli.startPromise));

  console.log(`${clientCount} clients has started`);

  console.log("send chat");

  function* genWaiter(): IterableIterator<ImClient> {
    let i = 0;
    for (; ;) {
      if (i == 3) {
        i = 0;
      }
      yield waiterList[i];
      i++;
    }
  }

  const waiterIter = genWaiter();

  const begin = Date.now();
  for (let i = 0; i < 100; i++) {
    for (const cli of imClientList) {
      cli.sendChatMsg(waiterIter.next().value.me!.id, 1, "hello");
      waiterIter.next().value.sendChatMsg(cli.me!.id, 1, "world");
    }
  }
  const end = Date.now();

  console.log(
    `send ${2 * 100 * waiterList.length * imClientList.length} msgs at`,
    end - begin,
    "ms"
  );
})();
