import React from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Room } from "@/app/data";
import { Info, Phone, Video } from "lucide-react";
import CloseIcon from "@mui/icons-material/Close";

interface ChatTopbarProps {
  selectedRoom?: Room | null;
  setSelectedRoom: React.Dispatch<React.SetStateAction<Room | null>>;
}

export const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }];

/**
 * 채팅방 UI 상단바
 * @param param0 
 * @returns 
 */
export default function ChatTopbar({
  selectedRoom,
  setSelectedRoom,
}: ChatTopbarProps) {

  // 채팅창 UI 닫기
  const close = (event: any) => {
    setSelectedRoom(null);
  };

  return (
    <div className="w-full h-20 flex p-4 justify-between items-center border-b">
      {selectedRoom && (
        <div className="flex items-center gap-2">
          <Avatar className="flex justify-center items-center">
            <AvatarImage
              alt={selectedRoom.name}
              width={6}
              height={6}
              className="w-10 h-10 "
            />
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{selectedRoom?.name}</span>
          </div>
        </div>
      )}
      <span onClick={close}>
        <CloseIcon />
      </span>
    </div>
  );
}
