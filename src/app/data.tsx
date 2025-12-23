// export const userData = [];

export const loggedInUserData = {
  id: 5,
  avatar: "/LoggedInUser.jpg",
  name: "Jakob Hoeg",
};

export type LoggedInUserData = typeof loggedInUserData;

/**
 * 메시지 형태 (Deprecated)
 */
export interface Message {
  to: string;
  from: string;
  message: string;
}

/**
 * 메시지 형태2
 */
export interface WebSocketMsg {
  type : string; // 메시지 브로커 메시지 타입 (RedisMessage.java)
  roomId: number; // 방 번호
  message: string; // 메시지 내용
  senderName : string; // 송신자의 닉네임
  roomName : string; // 수신된 채팅방 명
}

export type User = {
  messages: Message[];
  name: string;
};

export enum RedisMessageType {
  INVITE,
  NEW_MESSAGE
}


export interface ChatMessage {
  id : string; // 채팅의 ID 값
  roomId : number; // 채팅방 ID
  userId : number;
  senderName : string; // 채팅을 보낸 유저의 닉네임
  message : string; // 메시지 내용
  sentAt : number; // 메시지를 보낸 시간 (timestamp millisec 단위)
}


/**
 * 채팅방 데이터 형식
 */

export interface Room {
  /**
   * 방 ID
   */
  id : number;

  /**
   * 채팅방명
   */
  name : string

  /**
   * 채팅 내역
   */
  messages : ChatMessage[];
}

/**
 * 친구 데이터 형식
 */
export interface Friend {
  /**
   * table의 ID 값
   */
  id : number;

  /**
   * 유저 닉네임
   */
  nickname : string;
}