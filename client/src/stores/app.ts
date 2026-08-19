import { defineStore } from "pinia";
import { ref } from "vue";

export type Role = "default" | "health" | "finance";

export const useAppStore = defineStore("app", () => {
  const currentConversationId = ref<number | null>(null);
  const conversations = ref<
    Array<{ id: number; title: string; updated_at: string; is_archived: boolean }>
  >([]);
  const connectionStatus = ref<"ok" | "down" | "restarting" | "failed">("ok");
  const currentRole = ref<Role>("default");
  const availableModels = ref<string[]>([]);
  const currentModel = ref<string>("");

  function setConnectionStatus(status: "ok" | "down" | "restarting" | "failed") {
    connectionStatus.value = status;
  }

  function selectConversation(id: number | null) {
    currentConversationId.value = id;
  }

  function setConversations(list: typeof conversations.value) {
    conversations.value = list;
  }

  function setRole(role: Role) {
    currentRole.value = role;
  }

  function setModels(models: string[]) {
    availableModels.value = models;
    if (models.length > 0 && !currentModel.value) {
      currentModel.value = models[0];
    }
  }

  function setModel(model: string) {
    currentModel.value = model;
  }

  return {
    currentConversationId,
    conversations,
    connectionStatus,
    currentRole,
    availableModels,
    currentModel,
    setConnectionStatus,
    selectConversation,
    setConversations,
    setRole,
    setModels,
    setModel,
  };
});
