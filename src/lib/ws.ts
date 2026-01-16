// ===============================
// WebSocket singleton state
// ===============================

const WEBSOCKET_CONNECT_URL = process.env.NEXT_PUBLIC_ONLINE_OPEN_CHAT_WS;

let socket: WebSocket | null = null;
let connecting = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

let currentUserId: number | null = null;
let shouldReconnect = true;

// 외부에서 주입받은 onMessage 핸들러를 보관
let messageHandler: ((event: MessageEvent) => void) | null = null;

const RECONNECT_DELAY = 1000; // 1초 (필요 시 backoff 가능)

// ===============================
// Public API
// ===============================

/**
 * WebSocket 연결
 * - 이미 연결되어 있으면 재사용
 * - 연결 중이면 중복 생성 방지
 * - onMessage 핸들러를 저장하고 연결 시마다 재등록
 */
export function connectWebSocket(
  userId: number,
  onMessage: (event: MessageEvent) => void
): WebSocket | null {
  currentUserId = userId;
  shouldReconnect = true;
  messageHandler = onMessage;

  // 이미 열린 소켓이 있으면 그대로 사용
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.onmessage = messageHandler;
    return socket;
  }

  // 연결 중이면 중복 생성 방지
  if (connecting) {
    return socket;
  }

  connecting = true;

  const wsUrl = `${WEBSOCKET_CONNECT_URL}?userId=${userId}`;
  socket = new WebSocket(wsUrl);

  // ===============================
  // WebSocket lifecycle handlers
  // ===============================

  socket.onopen = () => {
    connecting = false;
    console.log("[WS] connected");

    // 재연결 포함: 항상 최신 handler 재등록
    if (messageHandler) {
      socket!.onmessage = messageHandler;
    }
  };

  socket.onerror = (error) => {
    console.error("[WS] error", error);
  };

  socket.onclose = (event) => {
    console.warn("[WS] closed", event.code, event.reason);

    socket = null;
    connecting = false;

    // 의도적 종료가 아니라면 재연결
    if (shouldReconnect && currentUserId !== null) {
      scheduleReconnect();
    }
  };

  return socket;
}

/**
 * 의도적으로 WebSocket 연결 종료
 * (로그아웃, 페이지 이탈 등)
 */
export function disconnectWebSocket() {
  shouldReconnect = false;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    socket.close();
    socket = null;
  }

  currentUserId = null;
  connecting = false;
  messageHandler = null;

  console.log("[WS] disconnected manually");
}

/**
 * 메시지 전송
 */
export function sendWsMessage(payload: unknown) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("[WS] send failed: socket not open");
    return;
  }

  socket.send(JSON.stringify(payload));
}

// ===============================
// Internal helpers
// ===============================

function scheduleReconnect() {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;

    if (!shouldReconnect || currentUserId === null || !messageHandler) {
      return;
    }

    console.log("[WS] attempting reconnect...");
    connectWebSocket(currentUserId, messageHandler);
  }, RECONNECT_DELAY);
}
