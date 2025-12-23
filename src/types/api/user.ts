import { ChatMessage, Friend } from "@/app/data";

/**
 * 친구목록 조회 요청 결과 
 */
export interface GetFriendListResponse {
    result : string,
    friendList: Friend[];
}