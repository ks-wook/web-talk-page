import { MyInfo, Room, WebSocketTextMessage } from "@/app/data";
import { cn } from "@/lib/utils";
import React, { useRef } from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import ChatBottombar from "./chat-bottombar";
import { AnimatePresence, motion } from "framer-motion";

interface ChatListProps {
  myInfo : MyInfo | null;
  selectedRoom: Room | null;
  sendMessage: (newMessage: WebSocketTextMessage) => void;
}

export function ChatList({
  myInfo,
  selectedRoom,
  sendMessage,
}: ChatListProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [selectedRoom]);


  return (
    <div className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col">
      <div
        ref={messagesContainerRef}
        className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col"
      >
        {/* 채팅방 메시지 내용 뿌리는 곳 */}
        <AnimatePresence>
          {selectedRoom?.messages?.map((message, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, scale: 1, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1, y: 1 }}
              transition={{
                opacity: { duration: 0.1 },
                layout: {
                  type: "spring",
                  bounce: 0.3,
                  duration:
                    selectedRoom?.messages?.indexOf(message) * 0.05 + 0.2,
                },
              }}
              className={cn(
                "flex flex-col gap-1 px-4 whitespace-pre-wrap mt-3",
                message.userId === myInfo?.userId ? "items-end" : "items-start"
              )}
            >
              {/* 상대 메시지일 경우 닉네임 표시 */}
              {message.userId !== myInfo?.userId && (
                <span className="text-xs text-muted-foreground ml-10">
                  {message.senderName}
                </span>
              )}

              <div className="flex gap-3 items-end">
                {message.userId !== myInfo?.userId && (
                  <Avatar className="flex justify-center items-center">
                    <AvatarImage alt={message.senderName} width={24} height={24} />
                  </Avatar>
                )}

                <span className="bg-accent p-3 rounded-md max-w-xs">
                  {message.message}
                </span>

                {message.userId === myInfo?.userId && (
                  <Avatar className="flex justify-center items-center">
                    <AvatarImage alt={message.senderName} width={24} height={24} />
                  </Avatar>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

      </div>
      <ChatBottombar
        myInfo={myInfo}
        selectedRoom={selectedRoom}
        sendMessage={sendMessage}
      />
    </div>
  );
}
