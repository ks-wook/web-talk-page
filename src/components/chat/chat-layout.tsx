"use client";

import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { Sidebar } from "../sidebar";
import { Chat } from "./chat";
import { User, Message, Friend, Room } from "@/app/data";
import api from "@/lib/axios";
import { redirect } from "next/navigation";

import * as StompJs from "@stomp/stompjs";
// import { User, User } from "lucide-react";
import { useUnmountEffect } from "framer-motion";
import { Client } from "@stomp/stompjs";
import { GetFriendListResponse } from "@/types/api/user";
import { GetJoinedRoomsResponse } from "@/types/api/chat";

interface ChatLayoutProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

export function ChatLayout({
  defaultLayout = [320, 480],
  defaultCollapsed = false,
  navCollapsedSize,
}: ChatLayoutProps) {

  // TODO : Connected Users가 아니라 Room으로 교체
  const [connectedUsers, setConnectedUsers] = React.useState<User[]>([]);

  // 채팅방 목록
  const [roomList, setRoomList] = React.useState<Room[]>([]);


  // 친구 목록
  const [friendList, setFriendList] = React.useState<Friend[]>([]);

  
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  // 현재 선택된 채팅방
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null);

  const myNickname = useRef<string | undefined>(undefined);

  const [client, setClient] = React.useState<Client | null>(null);

  const [messagesState, setMessages] = React.useState<Message[]>(
    selectedUser?.messages ?? [] // selectedUser가 null일 경우 빈 배열을 사용
  );

  /**
   * chat-layout 마운트 완료 시 최초 한번 호출
   */
  useEffect(() => {
    const init = async () => {
      try {

        // TODO : 비동기 태스크로 묶어서 한방에 처리 후 정상 처리 로그 찍기
        getMyInfo();
        getFriendList();
        getChatRoomList();
        
      } catch (e) {
        console.error('chat layout 마운트 에러 발생', e);
      }
    };

    init();

  }, []);

  /**
   * 현재 유저 닉네임 세팅
   */
  const getMyInfo = async () => {
    try {
      const res = await api.get<GetMyInfoResponse>('/api/v1/auth/get-my-info');
      console.log('[getMyInfo] /get-my-info 호출 결과 : ', res);

      // 현재 유저 닉네임 세팅
      myNickname.current = res.data.nickname;
    } catch (e) {
      console.log('Not logged in');
    }

  };

  /**
   * 현재 유저 친구목록 조회
   */
  const getFriendList = async () => {
    try {
      const res = await api.get<GetFriendListResponse>('/api/v1/user/get-friendList');
      console.log('[getFriendList] /get-friendList 호출 결과 : ', res.data);

      // 현재 유저 친구 목록 세팅
      setFriendList(res.data.friendList);
    } catch (e) {
      console.log('Not logged in');
    }

  };

  /**
   * 현재 유저 참여중인 채팅방 목록 조회
   */
  const getChatRoomList = async () => {
    try {
      const res = await api.get<GetJoinedRoomsResponse>('/api/v1/chat/get-joined-rooms');
      console.log('[getChatRoomList] /get-joined-rooms 호출 결과 : ', res.data);

      // 현재 참여중인 채팅방 목록 세팅
      setRoomList(res.data.roomList);
    } catch (e) {
      console.log('Not logged in');
    }

  };


  const useMountEffect = () => {
    const authCookie = getCookie("onlineOpenChatAuth");

    if (client === null) {
      console.log('[setSocket] 채팅 서버 접속 기록이 없습니다. 웹소켓 접속을 시도합니다.');

      const setSocket = async () => {
        const C = new StompJs.Client({
          brokerURL: "ws://localhost:7002/ws-stomp" + `?token=` + authCookie,
          connectHeaders: {
            Authorization: `Bearer ${authCookie}`,
          },
          reconnectDelay: 5000,
          onConnect: () => {
            console.log("채팅 서버 접속 완료...");
            subscribe(C); // Pass the client instance
          },
          onWebSocketError: (error) => {
            console.log("Error with websocket", error);
          },
          onStompError: (frame) => {
            console.dir(`Broker reported error: ${frame.headers.message}`);
            console.dir(`Additional details: ${frame}`);
          },
        });

        console.log('[세팅된 소켓] : ', C);

        setClient(C); // WebSocket 클라이언트를 저장
        C.activate();
      };

      setSocket();
    }
  };

  useMountEffect();

  /**
   * 웹소켓 채널 구독
   * @param clientInstance 
   */
  const subscribe = (clientInstance: StompJs.Client) => {
    console.log("웹소켓 구독 요청...");

    // TODO : /chat 뒤에 룸 ID를 붙여서 구독처리

    // 로그인한 계정의 알림용 채널로 구독요청
    clientInstance.subscribe(
      `/sub/chat`,
      (received_message: StompJs.IFrame) => {
        const message: Message = JSON.parse(received_message.body);
        const item = window.localStorage.getItem("selectedUser");

        if (item != null) {
          const user: User = JSON.parse(item);

          // 현재 채팅방의 채팅인 경우만 UI에 표시...
          // TODO : 현재 방의 채팅만 가져올 것이므로 나중에는 다 표시할 것임
          if (message.to == user.name || message.from == user.name) {
            setMessages((prevMessages) => [...prevMessages, message]);
          }
        }
      }
    );
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(
          sizes
        )}`;
      }}
      className="h-full items-stretch"
    >
      <ResizablePanel
        defaultSize={defaultLayout[0]}
        collapsedSize={navCollapsedSize}
        collapsible={true}
        minSize={24}
        maxSize={30}
        onCollapse={() => {
          setIsCollapsed(true);
          document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
            true
          )}`;
        }}
        onExpand={() => {
          setIsCollapsed(false);
          document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
            false
          )}`;
        }}
        className={cn(
          isCollapsed &&
            "min-w-[50px] md:min-w-[70px] transition-all duration-300 ease-in-out"
        )}
      >
        <Sidebar
          me={myNickname} // 현재 유저 닉네임
          isCollapsed={isCollapsed}
          links={connectedUsers}
          friendList={friendList} // 친구 목록
          roomList={roomList} // 채팅방 목록
          selectedRoom={selectedRoom} // 현재 선택된 방
          setConnectedUsers={setConnectedUsers}
          setRoomList={setRoomList}
          setSelectedUser={setSelectedUser}
          setSelectedRoom={setSelectedRoom}
          setMessages={setMessages}
        />
      </ResizablePanel>

      {selectedRoom && (
        <>
          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
            <Chat
              messagesState={messagesState}
              me={myNickname}
              client={client}

              selectedRoom={selectedRoom}
              setSelectedRoom={setSelectedRoom}

              // TEMP =========================
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              // ==============================
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
