import { cookies } from "next/headers";
import { ChatLayout } from "@/components/chat/chat-layout";
import Link from "next/link";
import { redirect } from "next/navigation";

/**
 * 채팅 웹사이트 메인화면
 * @returns 
 */
export default function Home() {

  const layout = cookies().get("react-resizable-panels:layout");
  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  const authCookie = cookies().get("onlineOpenChatAuth");

  // 로그인이 안되어 있으면서 + 현재 로그인 페이지가 아닌 경우
  if (!authCookie) {
    redirect("/login");
  }

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center justify-center p-4 md:px-24 py-32 gap-4">
      <div className="flex justify-between max-w-5xl w-full items-center">
        <Link href="#" className="text-4xl font-bold text-gradient">
          OnlineOpenChat 프로젝트 클라이언트
        </Link>
      </div>

      <div className="z-10 border rounded-lg max-w-5xl w-full h-full text-sm lg:flex">
        <ChatLayout defaultLayout={defaultLayout} navCollapsedSize={8} />
      </div>
    </main>
  );
}
