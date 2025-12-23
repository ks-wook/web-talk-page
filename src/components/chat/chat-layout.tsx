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
import { Friend, Room, WebSocketMsg } from "@/app/data";
import api from "@/lib/axios";
import { redirect } from "next/navigation";

import * as StompJs from "@stomp/stompjs";
// import { User, User } from "lucide-react";
import { useUnmountEffect } from "framer-motion";
import { Client } from "@stomp/stompjs";
import { GetFriendListResponse } from "@/types/api/user";
import { GetJoinedRoomsResponse } from "@/types/api/chat";
import { subscribeNotificationChannel } from "@/lib/notificationSubscriber";
import { ChatSubscriptionManager } from "@/lib/chatSubscriptions";

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

  // 채팅방 목록
  const [roomList, setRoomList] = React.useState<Room[]>([]);

  // 친구 목록
  const [friendList, setFriendList] = React.useState<Friend[]>([]);

  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // 현재 선택된 채팅방
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null);

  const myNickname = useRef<string | undefined>(undefined);
  const myId = useRef<number | undefined>(undefined);

  const [client, setClient] = React.useState<Client | null>(null);

  /**
   * 웹소켓 구독 관리 매니저 클래스
   */
  const managerRef = useRef<ChatSubscriptionManager | null>(null);


  /**
   * chat-layout 마운트 완료 시 최초 한번 호출
   */
  useEffect(() => {
    const init = async () => {
      try {
        // 1) UI 로딩 시 호출이 필요한 API들 정리
        const promises = [
          getMyInfo(),
          getFriendList(),
          getChatRoomList(),
        ];

        // 2) 모든 Promise 완료 대기
        await Promise.all(promises);

        // 3) 모두 처리된 이후 채팅서버 접속(웹소켓) 처리 로직 실행
        connectChatServer();

        console.log('채팅 프로그램 접속 완료...');

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
      myId.current = res.data.userId;
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

  const connectChatServer = () => {
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
            console.log("알림서버 채널에 구독을 요청합니다...");

            // 세팅 완료된 소켓에 대해 구독 매니저 세팅
            managerRef.current = new ChatSubscriptionManager(C);

            // 유저 알림 채널 구독 요청
            managerRef.current.subscribeNotification(myId.current, (payload) => {
              const notification : WebSocketMsg = payload as WebSocketMsg;
              console.log('알림 수신 : ', notification);

              // 받은 메시지의 타입이 invite인 경우 채팅방 생성
              if(notification.type === "INVITE") {              
                // 새로운 채팅방 추가
                const newRoom : Room = {
                  id : notification.roomId,
                  name : notification.roomName,
                  messages : []
                } as Room

                setRoomList(prev => [...prev, newRoom]);
              
              }
            });

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

  // connectChatServer();

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
          friendList={friendList} // 친구 목록
          roomList={roomList} // 채팅방 목록
          selectedRoom={selectedRoom} // 현재 선택된 방
          chatSubscriptionManagerRef={managerRef} // 구독 매니저 값
          setRoomList={setRoomList}
          setSelectedRoom={setSelectedRoom}
        />
      </ResizablePanel>

      {selectedRoom && (
        <>
          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
            <Chat
              me={myNickname}
              client={client}
              selectedRoom={selectedRoom}
              setSelectedRoom={setSelectedRoom}
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
