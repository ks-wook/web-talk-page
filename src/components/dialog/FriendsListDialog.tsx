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

import api from '@/lib/axios'
import { UpdateStatusTextResponse, UpdateNicknameResponse } from '@/types/api/user'

import { useGlobalModal } from '@/components/modal/GlobalModalProvider'
import { useRouter } from 'next/navigation'

import { Pencil, Check } from 'lucide-react'

type Props = {
  showModal: boolean
  friendList: Friend[]
  myInfo: MyInfo | null
  onClose: () => void
}

export default function FriendsListDialog({
  showModal,
  friendList,
  myInfo,
  onClose,
}: Props) {
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [isEditingNickname, setIsEditingNickname] = useState(false)

  const [statusText, setStatusText] = useState(myInfo?.statusText || '')
  const [nickname, setNickname] = useState(myInfo?.nickname || '')

  const { openModal } = useGlobalModal()
  const router = useRouter()

  const getNicknameBase = (value: string) => {
    if (!value) return ''
    const idx = value.indexOf('#')
    return idx >= 0 ? value.substring(0, idx) : value
  }

  useEffect(() => {
    setStatusText(myInfo?.statusText || '')
    setNickname(myInfo?.nickname || '')
  }, [myInfo])

  const handleSaveStatus = async () => {
    const res = await api.post<UpdateStatusTextResponse>(
      '/api/v1/user/update-status-text',
      { statusText }
    )

    if (res.data.result === 'SUCCESS') {
      setStatusText(res.data.statusText)
      openModal({
        title: '성공',
        content: <div className="text-green-600">상태 메시지가 변경되었습니다.</div>,
      })
    } else {
      openModal({
        title: '요청 실패',
        content: <div className="text-red-600">{res.data.result}</div>,
      })
    }

    setIsEditingStatus(false)
  }

  const handleSaveNickname = async () => {
    const res = await api.post<UpdateNicknameResponse>(
      '/api/v1/user/update-nickname',
      { newNickname: nickname }
    )

    if (res.data.result === 'SUCCESS') {
      setNickname(res.data.changedNickname)
      openModal({
        title: '성공',
        content: <div className="text-green-600">닉네임이 변경되었습니다.</div>,
      })
    } else {
      openModal({
        title: '요청 실패',
        content: <div className="text-red-600">{res.data.result}</div>,
      })
    }

    setIsEditingNickname(false)
  }

  const logout = async () => {
    const res = await api.get('/api/v1/auth/logout')

    if (res.data.result === 'SUCCESS') {
      document.cookie =
        'onlineOpenChatAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      router.push('/login')
    } else {
      openModal({
        title: '요청 실패',
        content: (
          <div className="text-red-600">
            로그아웃에 실패하였습니다. : {res.data.result}
          </div>
        ),
      })
    }
  }

  const onFriendListClose = () => {
    // 닉네임 수정 버튼이 활성화 되어있다면 기존 값으로 변경
    if(isEditingNickname) { 
      setNickname(myInfo?.nickname || '')
    }
    setIsEditingStatus(false)
    setIsEditingNickname(false)
    onClose()
  }

  return (
    <Transition appear show={showModal} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onFriendListClose}>
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
                내 정보 및 친구 목록
              </Description>

              <div className="mb-3 rounded-xl border bg-gray-50 p-2">
                <div className="flex gap-3 rounded-lg bg-white px-3 py-2 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-semibold text-green-600">
                    {nickname.length > 0 ? nickname.charAt(0) : ''}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-1">
                      {isEditingNickname ? (
                        <>
                          <input
                            value={nickname}
                            maxLength={20}
                            onChange={(e) => setNickname(e.target.value)}
                            className="rounded-md border px-2 py-1 text-sm"
                          />
                          <button
                            onClick={handleSaveNickname}
                            className="rounded-md p-1 text-blue-600 hover:bg-blue-50"
                            title="닉네임 저장"
                          >
                            <Check size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium">
                            {nickname}{' '}
                            <span className="text-xs text-gray-400">(나)</span>
                          </span>
                          <button
                            onClick={() => {
                              setNickname(getNicknameBase(nickname))
                              setIsEditingNickname(true)
                            }}
                            className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                            title="닉네임 수정"
                          >
                            <Pencil size={16} />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isEditingStatus ? (
                        <>
                          <input
                            value={statusText}
                            maxLength={255}
                            onChange={(e) => setStatusText(e.target.value)}
                            className="rounded-md border px-2 py-1 text-xs"
                          />
                          <button
                            onClick={handleSaveStatus}
                            className="rounded-md p-1 text-blue-600 hover:bg-blue-50"
                            title="상태 메시지 저장"
                          >
                            <Check size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-gray-500">
                            {statusText || '상태 메시지가 없습니다.'}
                          </span>
                          <button
                            onClick={() => setIsEditingStatus(true)}
                            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                            title="상태 메시지 수정"
                          >
                            <Pencil size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border bg-gray-50 p-2">
                {friendList.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex gap-3 rounded bg-white px-3 py-2 shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                      {friend.nickname.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {friend.nickname}
                      </span>
                      <span className="text-xs text-gray-500">
                        {friend.statusText || '상태 메시지가 없습니다.'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between">
                <button
                  onClick={logout}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white"
                >
                  로그아웃
                </button>
                <button
                  onClick={onFriendListClose}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm"
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
