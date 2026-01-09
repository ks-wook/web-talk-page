import { MyInfo, Room, WebSocketTextMessage } from "@/app/data";
import ChatTopbar from "./chat-topbar";
import { ChatList } from "./chat-list";
import React from "react";
import { sendWsMessage } from "@/lib/ws";

interface ChatProps {
  myInfo : MyInfo | null;
  selectedRoom: Room | null;
  setSelectedRoom: React.Dispatch<React.SetStateAction<Room | null>>;
}

import { useGlobalModal } from '@/components/modal/GlobalModalProvider';

export function Chat({
  myInfo,
  selectedRoom,
  setSelectedRoom,
}: ChatProps) {
  const { openModal } = useGlobalModal();
  
  /**
   * 채팅 보내는 함수
   * @param newMessage
   */
  const sendMessage = (newMessage: WebSocketTextMessage) => {

    console.log("Sending message...", newMessage);

    // 웹소켓 메시지 전송
    sendWsMessage(newMessage);
  };

  return (
    <div className="flex flex-col justify-between w-full h-full">
      <ChatTopbar
        selectedRoom={selectedRoom}
        setSelectedRoom={setSelectedRoom}
      />

      <ChatList
        myInfo={myInfo}
        selectedRoom={selectedRoom}
        sendMessage={sendMessage}
      />
    </div>
  );
}
