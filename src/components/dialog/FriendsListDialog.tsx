'use client'

import { Friend } from '@/app/data'
import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { Fragment } from 'react'

type Props = {
  showModal: boolean
  friendList: Friend[]
  onClose: () => void
}

type Friend2 = {
  id: string
  name: string
  statusMessage: string
}

const dummyFriends: Friend2[] = [
  { id: '1', name: '김민수', statusMessage: '지금 접속 중' },
  { id: '2', name: '이영희', statusMessage: '개발 중... 💻' },
  { id: '3', name: '박철수', statusMessage: '밥 먹는 중 🍚' },
  { id: '4', name: '최지은', statusMessage: '카톡 환영 😊' },
  { id: '5', name: '홍길동', statusMessage: '자리 비움' },
]

/**
 * 친구 목록 컴포넌트
 */
export default function FriendsListDialog({ showModal, friendList, onClose }: Props) {
  
  // console.log('전달받은 친구 목록 : ', friendList);
  
  return (
    <Transition appear show={showModal} as={Fragment}>
      {/* ✅ Dialog는 실제 DOM 요소여야 함 */}
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* ✅ Overlay 애니메이션 */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/40"
            aria-hidden="true"
          />
        </TransitionChild>

        {/* 중앙 정렬 컨테이너 */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          {/* ✅ Dialog Panel 애니메이션 */}
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
                카카오톡처럼 세로로 나열된 친구 목록입니다.
              </Description>

              {/* 친구 리스트 */}
              <div className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2">
                {friendList.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm"
                  >
                    {/* 아바타 이니셜 */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                      {friend.nickname.charAt(0)}
                    </div>

                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {friend.nickname}
                      </span>
                      <span className="truncate text-xs text-gray-500">
                        {"TODO : 유저별 상태 메시지 값 추가"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 닫기 버튼 */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
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
