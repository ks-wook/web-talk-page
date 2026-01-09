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
import { Friend, MyInfo, Room, WebSocketTextMessage } from "@/app/data";
import api from "@/lib/axios";

import { GetFriendListResponse } from "@/types/api/user";
import { GetJoinedRoomsResponse } from "@/types/api/chat";
import { ChatSubscriptionManager } from "@/lib/chatSubscriptions";
import { connectWebSocket, disconnectWebSocket } from "@/lib/ws";

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

  // 현재 선택된 채팅방 ref
  const selectedRoomRef = useRef<Room | null>(null);

  // 모바일에서 사이드바 표시 여부
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(true);
  
  // 모바일 여부 감지
  const [isMobile, setIsMobile] = React.useState(false);


  /**
   * 현재 유저 정보
   */
  const [myInfo, setMyInfo] = useState<MyInfo | null>(null);

  /**
   * 웹소켓 구독 관리 매니저 클래스
   */
  const managerRef = useRef<ChatSubscriptionManager | null>(null);

  /**
   * 모바일 감지
   */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 초기 체크
    checkMobile();

    // 윈도우 리사이즈 감지
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * selectedRoom이 null이 되면 모바일에서 사이드바 자동 표시
   */
  useEffect(() => {
    if (selectedRoom === null && isMobile) {
      setIsMobileSidebarOpen(true);
    } else if (selectedRoom !== null && isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [selectedRoom, isMobile]);

  /**
   * 유저정보 갱신
   */
  const initMyInfo = async () => {
    try {
      // 1) UI 로딩 시 호출이 필요한 API들 정리
      const promises = [
        getMyInfo(),
        getFriendList(),
        getChatRoomList(),
      ];

      // 2) 모든 Promise 완료 대기
      await Promise.all(promises);

    } catch (e) {
      console.error('chat layout 마운트 에러 발생', e);
    }
  };

  /**
   * chat-layout 마운트 완료 시 최초 한번 호출
   */
  useEffect(() => {
    initMyInfo();
  }, []);

 /**
   * 유저 정보 갱신 완료 후 웹소켓 접속
   */
  useEffect(() => {
    if(myInfo) {
      // connectChatServer();
      connectChatServer2(myInfo);
    }

    return () => {
      // 언마운트 시 웹소켓 연결 종료
      disconnectWebSocket();
    }
  }, [myInfo]);

  /**
   * selectedRoom 변경 시 ref 업데이트
   * stale closure 문제 해결용
   */
  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);


  const connectChatServer2 = (myInfo : MyInfo) => {
    const ws = connectWebSocket(myInfo.userId, messageHandler);
    if(ws) {
      console.log('[chat-layout] 웹소켓 연결 완료 : ', ws);
    }
    else {
      console.error('[chat-layout] 웹소켓 연결 실패');
    }
      
  }

  const messageHandler = (event: MessageEvent) => {
    console.log("Received WS message: ", event.data);
    
        try {
          const data = JSON.parse(event.data) as WebSocketTextMessage;
          console.log("[WS] message", data);

          // 받은 메시지의 타입이 invite인 경우 채팅방 생성
          if(data.type === "INVITE") {

            // 새로운 채팅방 추가
            const newRoom : Room = {
              id : data.roomId,
              name : data.roomName,
              messages : []
            } as Room
              
            setRoomList(prev => [...prev, newRoom]);
          }
          else if(data.type === "NEW_MESSAGE") {

            console.log("[WS] New message received for room ", selectedRoomRef.current?.id);

            // 현재 선택된 방에서 온 메시지인 경우만 UI에 추가
            if(data.roomId === selectedRoomRef.current?.id) {
              setSelectedRoom(prev => {
                if (!prev) return prev;

                // 초기화가 안되어있다면 빈배열로 세팅
                if(prev.messages === undefined || prev.messages === null) {
                  prev.messages = [];
                }

                return {
                  ...prev,                 // 기존 room 유지
                  messages: [...prev.messages, data] // messages만 갱신
                };
              });
            }
            
            
          }
          else {
            console.error("Unknown WS message type", data);
          }


        } catch (e) {
          console.error("Invalid WS message", event.data);
        
        }

  }


  /**
   * 현재 유저 닉네임 세팅
   */
  const getMyInfo = async () => {
    try {
      const res = await api.get<GetMyInfoResponse>('/api/v1/auth/get-my-info');
      console.log('[getMyInfo] /get-my-info 호출 결과 : ', res);

      // 현재 유저 정보 세팅
      setMyInfo({
        userId: res.data.userId,
        nickname: res.data.nickname,
        statusText: res.data.statusText
      } as MyInfo);

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
              "min-w-[50px] md:min-w-[70px] transition-all duration-300 ease-in-out",
            isMobile && !isMobileSidebarOpen && "hidden"
          )}
        >
          <Sidebar
            isCollapsed={isCollapsed}
            friendList={friendList} // 친구 목록
            roomList={roomList} // 채팅방 목록
            selectedRoom={selectedRoom} // 현재 선택된 방
            chatSubscriptionManagerRef={managerRef} // 구독 매니저 값
            myInfo={myInfo}
            setRoomList={setRoomList}
            setSelectedRoom={setSelectedRoom}
            setFriendList={setFriendList}
            initMyInfo={initMyInfo} // 유저 정보 갱신 함수
            setMyInfo={setMyInfo}
          />
        </ResizablePanel>

        {selectedRoom && (
          <>
            <ResizableHandle withHandle className={cn(isMobile && "hidden")} />

            <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
              <Chat
                myInfo={myInfo}
                selectedRoom={selectedRoom}
                setSelectedRoom={setSelectedRoom}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
  );
}
