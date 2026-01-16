"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import "./auth.css";
import api from "@/lib/axios";

import { useGlobalModal } from '@/components/modal/GlobalModalProvider';

/**
 * 회원가입 페이지 컴포넌트
 * @returns 
 */
export default function Register() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const router = useRouter();
  const { openModal } = useGlobalModal();

  useEffect(() => {
    const authCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth="));
    if (authCookie) {
      router.push("/");
    }
  }, [router]);

  /**
   * 회원가입 버튼 클릭
   * @param event 
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // Add registration logic here

    if(nickname.trim() === "") {
      // 닉네임 유효성 검사
      openModal({
        title: '입력 오류',
        content: (
          <div className="text-green-600">
            닉네임을 입력해주세요.
          </div>
        ),
      });
      return;
    }
    // 닉네임에 #같은 특수문자 포함 불가 처리
    if(/[^a-zA-Z0-9가-힣]/.test(nickname)) {
      openModal({
        title: '입력 오류',
        content: (
          <div className="text-green-600">
            닉네임에 특수문자는 포함할 수 없습니다.
          </div>
        ),
      });
      return;
    }

    const res = await api.post<CreateUserResponse>("/api/v1/auth/create-user", {
      loginId: username,
      password: password,
      nickname: nickname,
    });

    console.log("[handleSubmit] 회원가입 요청 API 호출 결과 : ", res.data);

    if(res.status !== 200 || res.data.result === "INTERNAL_SERVER_ERROR" ) {
      openModal({
        title: '요청 실패',
        content: (
          <div className="text-green-600">
            회원가입 요청에 실패하였습니다.
          </div>
        ),
      });
      return;
    }
    else if(res.data.result === "USER_ALREADY_EXISTS" ) {
      openModal({
        title: '요청 실패',
        content: (
          <div className="text-green-600">
            이미 존재하는 ID 입니다. 다른 ID를 사용해주세요.
          </div>
        ),
      });
      return;
    }
    else if(res.data.result === "USER_SAVED_FAILED" ) {
      openModal({
        title: '요청 실패',
        content: (
          <div className="text-green-600">
            유저정보 저장에 실패하였습니다. 잠시후 다시 시도해주세요.
          </div>
        ),
      });
      return;
    }
    
    // 회원가입 성공 시 login 화면으로 이동
    router.push("/login");
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2 className="auth-label" style={{ textAlign: "center", fontSize: "1.5rem" }}>회원가입</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="auth-label">
              ID
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          <div>
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          <div>
            <label htmlFor="nickname" className="auth-label">
              닉네임
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          <button type="submit" className="auth-button" style={{background: "#a78bfa"}}>
            Sign Up
          </button>
        </form>
        <p className="auth-footer">
          이미 계정이 있으신가요? <a href="/login">로그인</a>
        </p>
      </div>
    </div>
  );
}
