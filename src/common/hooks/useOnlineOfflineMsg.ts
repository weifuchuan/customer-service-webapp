import { useEffect } from "react";
import { ImClient, IOnlineOfflinePushPayload } from "@/common/im";
import message from "@/common/kit/message";


export default function useOnlineOfflineMsg(imClient: ImClient) {
  useEffect(() => {
    const online = (msg: IOnlineOfflinePushPayload) => {
      message.info(`“${msg.nickName}”已上线。`, 1);
    };

    const offline = (msg: IOnlineOfflinePushPayload) => {
      message.info(`“${msg.nickName}”已下线。`, 1);
    };

    imClient.bus.addListener("online", online);
    imClient.bus.addListener("offline", offline);

    return () => {
      imClient.bus.removeListener("online", online);
      imClient.bus.removeListener("offline", offline);
    };
  }, []);

}