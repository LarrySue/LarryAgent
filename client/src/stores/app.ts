import { defineStore } from "pinia";
import { ref } from "vue";

// 全局应用状态
// - currentConversationId：当前选中的会话 ID（null = 未选中/新建）
// - conversations：会话列表（P4.3 后端补全后填充）
// - connectionStatus：后端连接状态（ok / down / restarting / failed）
//   由 Tauri 的 "backend-status" 事件驱动（P4.1 崩溃感知）
export const useAppStore = defineStore("app", () => {
  const currentConversationId = ref<number | null>(null);
  const conversations = ref<
    Array<{ id: number; title: string; updated_at: string; is_archived: boolean }>
  >([]);
  const connectionStatus = ref<"ok" | "down" | "restarting" | "failed">("ok");

  function setConnectionStatus(status: "ok" | "down" | "restarting" | "failed") {
    connectionStatus.value = status;
  }

  function selectConversation(id: number | null) {
    currentConversationId.value = id;
  }

  function setConversations(list: typeof conversations.value) {
    conversations.value = list;
  }

  return {
    currentConversationId,
    conversations,
    connectionStatus,
    setConnectionStatus,
    selectConversation,
    setConversations,
  };
});
