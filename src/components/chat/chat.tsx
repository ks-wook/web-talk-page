import { Room, WebSocketMsg } from "@/app/data";
import ChatTopbar from "./chat-topbar";
import { ChatList } from "./chat-list";
import React from "react";
import { Client } from "@stomp/stompjs";

interface ChatProps {
  me: React.RefObject<string>;
  client: Client;
  selectedRoom: Room | null;
  setSelectedRoom: React.Dispatch<React.SetStateAction<Room | null>>;
}

export function Chat({
  me,
  client,
  selectedRoom,
  setSelectedRoom,
}: ChatProps) {
  // selectedUser가 null인 경우, 빈 배열로 초기화

  /**
   * 채팅 보내는 함수
   * @param newMessage
   */
  const sendMessage = (newMessage: WebSocketMsg) => {
    if (client) {
      // 현재 선택된 채팅방으로 메시지 퍼블리싱
      if(selectedRoom) {
        client.publish({
          destination: `/pub/chat/message/${selectedRoom.id}`,
          body: JSON.stringify(newMessage),
        });
      }

      console.log(`> Send message: ${newMessage.message}`);
    }
  };

  return (
    <div className="flex flex-col justify-between w-full h-full">
      <ChatTopbar
        selectedRoom={selectedRoom}
        setSelectedRoom={setSelectedRoom}
      />

      <ChatList
        me={me}
        selectedRoom={selectedRoom}
        sendMessage={sendMessage}
      />
    </div>
  );
}
