"use client";

import Link from "next/link";
import { MessageSquarePlus, Search, Send, User, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage } from "./ui/avatar";
import { User as UserData, Message, Friend, Room, WebSocketMsg } from "@/app/data";
import React, { useEffect } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "@mui/material/styles"; // MUI 스타일 추가
import api from "@/lib/axios";
import CreateRoomDialog from "./dialog/CreateRoomDialog";
import FriendsListDialog from "./dialog/FriendsListDialog";
import { ChatSubscriptionManager } from "@/lib/chatSubscriptions";
import { ChatListResponse } from "@/types/api/chat";

interface SidebarProps {
  me: React.RefObject<string>;
  isCollapsed: boolean;
  // links: UserData[];
  friendList : Friend[];
  roomList : Room[];
  selectedRoom : Room | null;
  chatSubscriptionManager : ChatSubscriptionManager | null;
  setRoomList: React.Dispatch<React.SetStateAction<Room[]>>;
  setSelectedRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  setConnectedUsers: React.Dispatch<React.SetStateAction<UserData[]>>;
  setSelectedUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const searchResult = (name: string): UserData => {
  return {
    name,
    messages: [], // 기본값으로 빈 배열
  };
};

function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

export const fetchUsers = async (searchQuery: string, myName: string | null): Promise<UserData[]> => {
  const token = getCookie("onlineOpenChatAuth");

  if (!token) {
    throw new Error("Authentication token not found in cookies");
  }

  // 유저 검색 요청
  const response = await api.get(`/api/v1/user/search/${searchQuery}?myName=${myName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true
  });

  console.log('[유저 검색 요청 결과] : ', response);

  const names = response.data.name;

  return names.map((n: string) => searchResult(n));
};

export function Sidebar({
  me,
  // links,
  friendList,
  isCollapsed,
  roomList,
  selectedRoom,
  chatSubscriptionManager,
  setRoomList,
  setConnectedUsers,
  setSelectedRoom,
  setSelectedUser,
  setMessages,
}: SidebarProps) {
  // 모달 제어
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const [showFriedsList, setShowFriedsList] = React.useState<boolean>(false);
  const [showCreateRoom, setShowCreateRoom] = React.useState<boolean>(false);

  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [searchResults, setSearchResults] = React.useState<UserData[]>([]);

  const handleSearch = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };



  const handleFriendsList = () => {
    setShowFriedsList(true);
  };

  const closeFriendsList = () => {
    setShowFriedsList(false);
  };

  const handleCreateRoom = () => {
    setShowCreateRoom(true);
  };

  const closeCreateRoom = () => {
    setShowCreateRoom(false);
  };





  const handleSearchQueryChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = event.target.value;

    setSearchQuery(query);
  };

  const handelSearchButton = async (event: any) => {
    const users = await fetchUsers(searchQuery, me.current);
    setSearchResults(users);
  };

  /**
   * 친구 추가 처리
   * @param user 
   */
  const addFriends = async (user: UserData) => {
    const token = getCookie('onlineOpenChatAuth');

    // 친구 추가 요청
    const res = await api.post(
      "/api/v1/user/add-friend",
      {
        friendNickname : user.name
      }, // data
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("[addFriends] 친구 추가 요청 결과 : ", res);

    /*
    setConnectedUsers((prevUsers) => {
      // user.id가 이미 prevUsers 배열에 있는지 확인
      const userExists = prevUsers.some(
        (existingUser) => existingUser.name === user.name
      );

      if (userExists) {
        // 이미 존재하는 경우 아무것도 하지 않음
        return prevUsers;
      }

      // 존재하지 않는 경우에만 추가
      return [...prevUsers, user];
    });
    */
  };

  const handleChangeRoom = async (room: Room) => {
    const token = getCookie('onlineOpenChatAuth');

    console.log('선택된 채팅방 : ', room);

    // TODO : redis를 통해 채팅 로그를 불러들어야함
    /*
    const result = await api.get("/api/v1/chat/chat-list", {
      params: {
        name: link.name,
        from: me.current,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true
    });
    */

    // setMessages(result.data.result);

    // 채팅 UI 상단 채팅방 제목 부분
    //window.localStorage.setItem("selectedUser", JSON.stringify(link));
    // setSelectedUser('test');

    // 채팅방의 ID를 통해 채팅용 웹소켓 연결
    if(room !== null && chatSubscriptionManager) {
      // 이전에 구독중이던 방 구독 해제

      console.log('이전에 구독중이던 채팅방 해제...');
      chatSubscriptionManager.unsubscribeChatRoom();

      // 구독할 채팅방의 이전 채팅목록을 받아온다.
      const res = await api.get<ChatListResponse>(`/api/v1/chat/rooms/${room.id}/messages`);

      console.log('[조회된 최근 채팅 내역] : ', res);

      // 이전 채팅 내역 세팅
      if(res.data.result === "SUCCESS") {
        room.messages = res.data.messages;
      }
      
      // 새로운 채팅방에 대해 구독 요청
      chatSubscriptionManager.subscribeChatRoom(room.id, (payload) => {
        console.log("[chat message]", payload as WebSocketMsg);

        // 현재 선택된 room에 대해 다른 값은 유지하고 message 값만 update
        setSelectedRoom(prev => {
          if (!prev) return prev;

          // 초기화가 안되어있다면 빈배열로 세팅
          if(prev.messages === undefined || prev.messages === null) {
            prev.messages = [];
          }

          return {
            ...prev,                 // 기존 room 유지
            messages: [...prev.messages, payload] // messages만 갱신
          };
        });

      });

      // UI에 현재 사용중인 방 세팅
      setSelectedRoom(room);

      console.log(`${room.id} 번 방에 구독이 완료되었습니다.`);
    }
    else { // 채팅방 선택 오류 발생
      console.error('채팅방 입장에 실패 하였습니다.');
      console.log('선택된 채팅방 : ', room);
      console.log('chatSubscriptionManager : ', chatSubscriptionManager);
    }    

  };

  return (
    <div
      data-collapsed={isCollapsed}
      className="relative group flex flex-col h-full gap-4 p-2 data-[collapsed=true]:p-2 "
    >
      <Dialog open={showModal} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogContent>
          <div className="flex items-center">
            <TextField
              fullWidth
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchQueryChange}
              InputProps={{
                endAdornment: (
                  <IconButton edge="end" color="primary">
                    <SearchIcon onClick={handelSearchButton} />
                  </IconButton>
                ),
              }}
            />
          </div>
          <List>
            {searchResults.length > 0 ? (
              searchResults.map((user, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={user.name}
                    onClick={() => {
                      addFriends(user);
                    }}
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No results found" />
              </ListItem>
            )}
          </List>
        </DialogContent>
      </Dialog>


      {/* 방 생성하기 UI*/}
      <CreateRoomDialog  showModal={showCreateRoom} friendList={friendList} roomList={roomList} setRoomList={setRoomList} onClose={closeCreateRoom} myName={me.current}/>
      
      {/* 친구 추가하기 UI*/}
      <FriendsListDialog showModal={showFriedsList} friendList={friendList} onClose={closeFriendsList}/>

      {!isCollapsed && selectedRoom === null && (
        <div className="flex justify-between p-2 items-center">
          <div className="flex gap-2 items-center text-2xl">
            <p className="font-medium">참여중인 채팅</p>
            <span className="text-zinc-300">({roomList.length})</span>
          </div>

          <div>
            {/* 친구 목록 버튼 */}
            <Link
              href="#"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9"
              )}
            >
              <User size={20} onClick={handleFriendsList} />
            </Link>

            {/* 친구 추가 버튼 */}
            <Link
              href="#"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9"
              )}
            >
              <UserPlus size={20} onClick={handleSearch} />
            </Link>

            {/* 채팅방 생성 버튼 */}
            <Link
              href="#"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9"
              )}
            >
              <MessageSquarePlus size={20} onClick={handleCreateRoom} />
            </Link>
          </div>
        </div>
      )}
      {!isCollapsed && selectedRoom && (
        <div className="flex flex-col items-center gap-2 p-2">
          {/* 제목 */}
          <div className="flex items-center gap-1 leading-tight">
            <p className="text-sm font-medium">
              참여중인 채팅
              <span className="text-xs text-zinc-400 ml-1">
                ({roomList.length})
              </span>
            </p>
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-1">
            <Link
              href="#"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
            >
              <User size={18} onClick={handleFriendsList} />
            </Link>

            <Link
              href="#"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
            >
              <UserPlus size={18} onClick={handleSearch} />
            </Link>

            <Link
              href="#"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
            >
              <MessageSquarePlus size={18} onClick={handleCreateRoom} />
            </Link>
          </div>
        </div>
      )}

      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {roomList.map((room, index) =>
          isCollapsed ? (
            <TooltipProvider key={index}>
              <Tooltip key={index} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href="#"
                    className={cn(
                      buttonVariants({ variant: "grey", size: "icon" }),
                      "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                    )}
                  >
                    <span className="sr-only">{room.name}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="flex items-center gap-4"
                >
                  {room.name}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Link
              key={index}
              href="#"
              className={cn(
                buttonVariants({ variant: "grey", size: "xl" }), // link.variant === "grey" &&
                "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white shrink"
              )}
              onClick={() => {
                handleChangeRoom(room);
              }}
            >
              
              <div className="flex flex-col max-w-28">
                <span>{room.name}</span>
                {/** 
                {room.messages.length > 0 && (
                  <span className="text-zinc-300 text-xs truncate ">
                    {link.messages[link.messages.length - 1].name.split(" ")[0]}
                    : {link.messages[link.messages.length - 1].message}
                  </span> 
                )}*/}
              </div>
               
            </Link>
          )
        )}
      </nav>
    </div>
  );
}
