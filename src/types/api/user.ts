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
 * 친구목록 조회 요청
 */
export interface GetFriendListResponse {
    result : string,
    friendList: Friend[];
}


/**
 * 상태메시지 수정 요청
 */
export interface UpdateStatusTextRequest {
    /**
     * 수정할 상태메시지 내용
     */
    statusText : string;
}

export interface UpdateStatusTextResponse {
    /**
     * 결과
     */
    result : string;

    /**
     * 수정된 상태메시지 내용
     */
    statusText : string;
}


/**
 * 닉네임 수정 요청
 */
export interface UpdateNicknameRequest {
    /**
     * 수정할 닉네임 내용
     */
    newNickname : string;
}

export interface UpdateNicknameResponse {
    /**
     * 결과
     */
    result : string;

    /**
     * 수정된 닉네임
     */
    changedNickname : string;
}  