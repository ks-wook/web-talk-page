import { Message, Room, User } from "@/app/data";
import ChatTopbar from "./chat-topbar";
import { ChatList } from "./chat-list";
import React from "react";
import { Client } from "@stomp/stompjs";

interface ChatProps {
  messagesState: Message[];
  me: React.RefObject<string>;
  client: Client;
  selectedUser: User;
  selectedRoom: Room | null;
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>;
  setSelectedRoom: React.Dispatch<React.SetStateAction<Room | null>>;
}

export function Chat({
  messagesState,
  me,
  client,
  selectedRoom,
  setSelectedRoom,

  // TEMP ===========
  selectedUser,
  setSelectedUser,
  // ================
}: ChatProps) {
  // selectedUser가 null인 경우, 빈 배열로 초기화

  // 채팅 보내기
  const sendMessage = (newMessage: Message) => {
    if (client) {
      client.publish({
        destination: `/pub/chat/message/${me.current}`,
        body: JSON.stringify(newMessage),
      });

      console.log(`> Send message: ${newMessage}`);
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
        messages={messagesState}
        selectedUser={selectedUser} // selectedUser가 null일 수 있음
        sendMessage={sendMessage}
      />
    </div>
  );
}
