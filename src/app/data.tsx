/**
 * 알림 채널로부터 받는 데이터
 */
export interface WebSocketTextMessage {
  type : string; // 메시지 브로커 메시지 타입 (RedisMessage.java)
  roomId: number; // 방 번호
  message: string; // 메시지 내용
  senderName : string; // 송신자의 닉네임
  roomName : string; // 수신된 채팅방 명
  userId : number; // 메시지 보낸 유저 ID
}

export type SearchedUser = {
  name: string;
};

export enum RedisMessageType {
  INVITE,
  NEW_MESSAGE,
  ERROR
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
  messages : WebSocketTextMessage[];
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

  /**
   * 상태 메시지
   */
  statusText : string;
}

export interface MyInfo {
  userId : number;
  nickname : string;
  statusText : string;
}