import { Room, WebSocketTextMessage } from "@/app/data";

/**
 * 채팅방 생성 요청
 */
export interface CreateRoomRequest {
    /**
     * 채팅방 명
     */
    roomName : string,

    /**
     * 참여자 명단(초대한 유저들)
     */
    participantIds : number[]
}

export interface CreateRoomResponse {
    /**
     * 결과
     */
    result : string,

    /**
     * 채팅방 명
     */
    roomName : string,

    /**
     * 생성된 채탕방 id 값
     */
    roomId : number;
}


/**
 * 참여중인 채팅방 목록 조회
 */
export interface GetJoinedRoomsResponse {
    /**
     * 결과
     */
    result : string;

    /**
     * 채팅방 목록
     */
    roomList : Room[]
}


/**
 * 최근 채팅방 채팅내역 조회 요청 결과
 * api : /api/v1/chat/rooms/{roomId}/messages
 */
export interface ChatListResponse {
    /**
     * 결과
     */
    result : string;
    
    /**
     * 채팅 내역 (최대 100개)
     */
    messages : WebSocketTextMessage[];
}