import { ChatMessage, Friend } from "@/app/data";

/**
 * 친구추가 요청
 */
export interface AddFriendRequest {
    /**
     * 추가할 친구 닉네임
     */
    friendNickname : string
}

export interface AddFriendResponse {
    /**
     * 결과
     */
    result : string;    
}


/**
 * 친구목록 조회 요청 결과 
 */
export interface GetFriendListResponse {
    result : string,
    friendList: Friend[];
}