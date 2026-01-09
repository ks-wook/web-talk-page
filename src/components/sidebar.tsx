"use client";

import Link from "next/link";
import { MessageSquarePlus, User, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { SearchedUser as UserData, Friend, Room, MyInfo } from "@/app/data";

import {
  Dialog,
  DialogContent,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "@mui/material/styles"; // MUI 스타일 추가
import api from "@/lib/axios";
import CreateRoomDialog from "./dialog/CreateRoomDialog";
import FriendsListDialog from "./dialog/FriendsListDialog";
import { ChatSubscriptionManager } from "@/lib/chatSubscriptions";
import { ChatListResponse } from "@/types/api/chat";
import React from "react";
import { AddFriendResponse, GetFriendListResponse } from "@/types/api/user";
import { useGlobalModal } from '@/components/modal/GlobalModalProvider';

interface SidebarProps {
  isCollapsed: boolean;
  friendList : Friend[];
  roomList : Room[];
  selectedRoom : Room | null;
  myInfo: MyInfo | null;
  chatSubscriptionManagerRef: React.RefObject<ChatSubscriptionManager | null>;
  setRoomList: React.Dispatch<React.SetStateAction<Room[]>>;
  setSelectedRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  setFriendList : React.Dispatch<React.SetStateAction<Friend[]>>;
  initMyInfo: () => Promise<void>;
  setMyInfo: React.Dispatch<React.SetStateAction<MyInfo | null>>;
}

const searchResult = (name: string): UserData => {
  return {
    name,
  };
};

function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

export const fetchUsers = async (searchQuery: string, myName: string | undefined | null): Promise<UserData[]> => {
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
  friendList,
  isCollapsed,
  roomList,
  selectedRoom,
  chatSubscriptionManagerRef,
  myInfo,
  setRoomList,
  setSelectedRoom,
  setFriendList,
  initMyInfo,
  setMyInfo,
}: SidebarProps) {
  // 모달 제어
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const [showFriedsList, setShowFriedsList] = React.useState<boolean>(false);
  const [showCreateRoom, setShowCreateRoom] = React.useState<boolean>(false);

  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [searchResults, setSearchResults] = React.useState<UserData[]>([]);

  const { openModal } = useGlobalModal();

  const handleSearch = () => {
    setShowModal(true);
  };

  const closeSearchModal = () => {
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
    console.log("검색어 : ", myInfo?.nickname);
    const users = await fetchUsers(searchQuery, myInfo?.nickname);
    setSearchResults(users);
  };

  /**
   * 친구 추가 처리
   * @param user 
   */
  const addFriends = async (user: UserData) => {

    // 친구 추가 요청
    const res = await api.post<AddFriendResponse>("/api/v1/user/add-friend", {
        friendNickname : user.name
      },
    );

    console.log("[addFriends] 친구 추가 요청 결과 : ", res);

    // 친구 검색 모달 닫기
    closeSearchModal();

    if(res.data.result === "SUCCESS") {
      openModal({
        title: '성공',
        content: (
          <div className="text-green-600">
            {user.name}님이 친구로 추가되었습니다.
          </div>
        ),
      });

      // 친구 목록 api 재호출, 친구목록 갱신
      const res = await api.get<GetFriendListResponse>('/api/v1/user/get-friendList');
      console.log('[getFriendList] /get-friendList 호출 결과 : ', res.data);

      if(res.data.result === "SUCCESS") {
        // 현재 유저 친구 목록 세팅
        setFriendList(res.data.friendList);
      }
      else {
        openModal({
          title: '요청 실패',
          content: (
            <div className="text-green-600">
              친구 목록 갱신에 실패하였습니다.
            </div>
          ),
        });
      }

      // 친구 추가 모달 닫기
      closeSearchModal();
    }
    else if(res.data.result === "ALREADY_FRIEND") {
      openModal({
        title: '요청 실패',
        content: (
          <div className="text-green-600">
            이미 친구로 등록된 유저입니다.
          </div>
        ),
      });

    }
    else if(res.data.result === "NOT_EXIST_USER") {
      openModal({
        title: '요청 실패',
        content: (
          <div className="text-green-600">
            존재하지 않는 유저입니다.
          </div>
        ),
      });
    }
    else {
      openModal({
        title: '요청 실패',
        content: (
          <div className="text-green-600">
            친구 추가에 실패하였습니다.
          </div>
        ),
      });
    }

  };

  const handleChangeRoom = async (room: Room) => {

    console.log('선택된 채팅방 : ', room);


    // 구독할 채팅방의 이전 채팅목록을 받아온다.
    const res = await api.get<ChatListResponse>(`/api/v1/chat/rooms/${room.id}/messages`);

    console.log('[조회된 최근 채팅 내역] : ', res);

    // 이전 채팅 내역 세팅
    if(res.data.result === "SUCCESS") {
      room.messages = res.data.messages;
    }

    setSelectedRoom(room);
  };

  return (
    <div
      data-collapsed={isCollapsed}
      className="relative group flex flex-col h-full gap-4 p-2 data-[collapsed=true]:p-2 "
    >
      <Dialog open={showModal} onClose={closeSearchModal} maxWidth="sm" fullWidth>
        <DialogContent>
          <div className="flex items-center">
            <TextField
              fullWidth
              placeholder="친구의 닉네임으로 검색할 수 있습니다."
              value={searchQuery}
              onChange={handleSearchQueryChange}
              InputProps={{
                endAdornment: (
                  <IconButton edge="end" color="primary" onClick={handelSearchButton}>
                    <SearchIcon />
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
      <CreateRoomDialog  showModal={showCreateRoom} friendList={friendList} roomList={roomList} setRoomList={setRoomList} onClose={closeCreateRoom} myName={myInfo?.nickname} myId={myInfo?.userId}/>
      
      {/* 친구 추가하기 UI*/}
      <FriendsListDialog showModal={showFriedsList} friendList={friendList} onClose={closeFriendsList} myInfo={myInfo} setMyInfo={setMyInfo}/>

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
