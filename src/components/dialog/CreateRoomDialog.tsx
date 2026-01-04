'use client'

import { Friend, Room } from '@/app/data'
import api from '@/lib/axios'
import { CreateRoomResponse } from '@/types/api/chat'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Description,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { useGlobalModal } from '@/components/modal/GlobalModalProvider';

type Props = {
  showModal: boolean
  friendList: Friend[],
  roomList: Room[],
  myName : string | null | undefined,
  myId : number | null | undefined,
  setRoomList: React.Dispatch<React.SetStateAction<Room[]>>
  onClose: () => void
}


/**
 * 새 채팅방 설정용 컴포넌트
 */
export default function CreateRoomDialog({ showModal, friendList, roomList, myName, myId, setRoomList, onClose }: Props) {
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([])
  const [roomName, setRoomName] = useState('')

  const { openModal } = useGlobalModal();

  const toggleFriend = (friend: Friend) => {
    setSelectedFriends((prev) =>
      prev.includes(friend)
        ? prev.filter((f) => f.id !== friend.id)
        : [...prev, friend]
    )
  }

  const handleCreateRoom = async () => {
    if (selectedFriends.length === 0) return

    const inviteeIds = [...selectedFriends.map(friend => friend.id), myId];
    console.log(inviteeIds);

    // setRoomList 호출하여 새로운 채팅방 추가 -> API 성공한 경우만
    const res = await api.post<CreateRoomResponse>("/api/v1/chat/create-room", {
      roomName: roomName,
      participantIds : inviteeIds
    });

    console.log('[CreateRoomResponse]  방 생성 요청 결과 : ', res);

    if(res.data.result === "SUCCESS") {

      openModal({
        title: '새로운 채팅방',
        content: (
          <div className="text-green-600">
            채팅방({roomName})이 생성되었습니다.
          </div>
        ),
      });
    }
    else {
      openModal({
        title: '요청 실패',
        content: (
          <div className="text-green-600">
            채팅방 생성에 실패하였습니다.
          </div>
        ),
      });
      console.error('[CreateRoomResponse] 채팅방 생성 실패');
    }

    setRoomName('')
    setSelectedFriends([])
    onClose()
  }

  useEffect(() => {
    console.log('[roomList changed]', roomList);
  }, [roomList]);

  const isCreateDisabled = selectedFriends.length === 0

  return (
    <Transition appear show={showModal} as={Fragment}>
      {/* ✅ Dialog는 반드시 실제 DOM 요소 */}
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
          <div className="fixed inset-0 bg-black/40" />
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
            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
              <DialogTitle className="mb-2 text-lg font-semibold">
                채팅방 생성
              </DialogTitle>

              <Description className="mb-3 text-sm text-gray-500">
                초대할 친구를 선택하고 방을 생성합니다.
              </Description>

              {/* 방 이름 */}
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  방 제목
                </label>
                <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="방 이름 (선택)"
                />
              </div>

              {/* 친구 선택 (체크박스) */}
              <div className="mb-2">
                <p className="mb-1 text-sm font-medium">
                  초대할 친구 선택 ({selectedFriends.length}명)
                </p>

                <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl bg-gray-50 p-2">
                  {friendList.map((friend) => {
                    const checked = selectedFriends.includes(friend)

                    return (
                      <label
                        key={friend.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm transition ${
                          checked ? 'ring-2 ring-emerald-400' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFriend(friend)}
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                        />

                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {friend.nickname}
                          </span>
                          <span className="text-xs text-gray-500">
                            {friend.statusText || '상태 메시지가 없습니다.'}
                          </span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="mt-4 flex justify-between">
                <button
                  onClick={onClose}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm"
                >
                  취소
                </button>

                <button
                  onClick={handleCreateRoom}
                  disabled={isCreateDisabled}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:bg-emerald-300"
                >
                  방 생성하기
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
