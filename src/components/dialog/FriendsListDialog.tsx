'use client'

import { Friend, MyInfo } from '@/app/data'
import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'

import api from '@/lib/axios';
import { UpdateStatusTextResponse } from '@/types/api/user';

import { useGlobalModal } from '@/components/modal/GlobalModalProvider';
import { useRouter } from 'next/navigation';
type Props = {
  showModal: boolean
  friendList: Friend[]
  myInfo : MyInfo | null;
  onClose: () => void,
}

/**
 * 친구 목록 컴포넌트 (내 정보 포함)
 */
export default function FriendsListDialog({
  showModal,
  friendList,
  myInfo,
  onClose,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [statusText, setStatusText] = useState(myInfo?.statusText || '');

  const { openModal } = useGlobalModal();

  const router = useRouter();

  /**
   * 내 정보가 변경되었을 때 상태 메시지 업데이트
   */
  useEffect(() => {
    setStatusText(myInfo?.statusText || '');
  }, [myInfo]);
  
  const handleSaveStatus = async () => {
    // 상태 메시지 수정 API 호출
    const res = await api.post<UpdateStatusTextResponse>('/api/v1/user/update-status-text', {
      statusText: statusText,
    });

    console.log('[FriendsListDialog] 상태메시지 변경 API 호출 결과 : ', res.data);

    if (res.data.result === 'SUCCESS') {

      setStatusText(res.data.statusText);

      openModal({
        title: '성공',
        content: (
          <div className="text-green-600">
            상태 메시지가 성공적으로 변경되었습니다.
          </div>
        ),
      });
    }
    else {
      openModal({
        title: '요청 실패',
        content: (
          <div className="text-green-600">
            상태메시지 변경에 실패하였습니다. : {res.data.result}
          </div>
        ),
      });
    }

    setIsEditing(false)
  }

  const onFriendListClose = () => {
    onClose();
    setIsEditing(false);
  }

  /**
   * 로그아웃 처리
   */
  const logout = async () => {

    // 로그아웃 api 호출
    const res = await api.get<LogoutResponse>('/api/v1/auth/logout');
    
    console.log('[FriendsListDialog] 로그아웃 API 호출 결과 : ', res);

    // 로그아웃 성공 시 /login 페이지로 이동
    if(res.data.result === 'SUCCESS') {
        // 로컬 기록용 AccessToken 삭제
      document.cookie = "onlineOpenChatAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      

      router.push('/login');
    }
    else {
      openModal({
        title: '요청 실패',
        content: (
          <div className="text-green-600">
            로그아웃에 실패하였습니다. : {res.data.result}
          </div>
        ),
      });
    }
  }

  return (
    <Transition appear show={showModal} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onFriendListClose}>
        {/* Overlay */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-4 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-4 scale-95"
          >
            <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
              <DialogTitle className="mb-2 text-lg font-semibold">
                친구 목록
              </DialogTitle>

              <Description className="mb-3 text-sm text-gray-500">
                내 정보 및 친구로 추가된 사용자 목록입니다.
              </Description>

              {/* ===================== */}
              {/* ✅ 내 정보 카드 */}
              {/* ===================== */}
              <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-2">
                <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm">
                  {/* 아바타 */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                    {myInfo?.nickname ? myInfo.nickname.charAt(0) : '?'}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-gray-900">
                      {myInfo?.nickname} <span className="text-xs text-gray-400">(나)</span>
                    </span>

                    {isEditing ? (
                      <input
                        value={statusText || ''}
                        maxLength={255}
                        onChange={(e) => setStatusText(e.target.value)}
                        className="mt-1 rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="상태 메시지를 입력하세요"
                      />
                    ) : (
                      <span className="truncate text-xs text-gray-500">
                        {statusText || '상태 메시지가 없습니다.'}
                      </span>
                    )}
                  </div>

                  {/* Edit / Save 버튼 */}
                  <div>
                    {isEditing ? (
                      <button
                        onClick={handleSaveStatus}
                        className="rounded-md bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600"
                      >
                        저장
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                      >
                        수정
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ===================== */}
              {/* 친구 리스트 */}
              {/* ===================== */}
              <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2">
                {friendList.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                      {friend.nickname.charAt(0)}
                    </div>

                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {friend.nickname}
                      </span>
                      <span className="truncate text-xs text-gray-500">
                        {friend.statusText || '상태 메시지가 없습니다.'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 닫기 버튼 */}
              <div className="mt-4 flex justify-between gap-2">
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  로그아웃
                </button>

                <button
                  type="button"
                  onClick={onFriendListClose}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  닫기
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
