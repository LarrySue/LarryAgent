import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { listRoles, type RoleInfo } from "@/api";

// 角色 key 动态化（清单由后端 config.yaml 经 /api/roles 下发，不再硬编码联合类型）
export type Role = string;

// 角色兜底：listRoles 失败 / 返回空、currentRole 不在清单时使用（防白屏）
export const FALLBACK_ROLES: RoleInfo[] = [
  { key: "default", label: "通用", color: "#9CA3AF" },
];

export const useAppStore = defineStore("app", () => {
  const currentConversationId = ref<number | null>(null);
  const conversations = ref<
    Array<{ id: number; title: string; updated_at: string; is_archived: boolean }>
  >([]);
  const connectionStatus = ref<"ok" | "down" | "restarting" | "failed">("ok");
  const currentRole = ref<Role>("default");
  const roles = ref<RoleInfo[]>([]);
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

  function setRoles(list: RoleInfo[]) {
    roles.value = list.length > 0 ? list : FALLBACK_ROLES;
  }

  /** 拉取后端角色清单；失败 / 空走兜底 */
  async function fetchRoles() {
    try {
      const list = await listRoles();
      setRoles(list);
    } catch {
      setRoles(FALLBACK_ROLES);
    }
  }

  /** 当前角色元数据；currentRole 不在清单时回退 default 兜底对象 */
  const currentRoleInfo = computed<RoleInfo>(() => {
    return roles.value.find((r) => r.key === currentRole.value) ?? FALLBACK_ROLES[0];
  });

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
    roles,
    currentRoleInfo,
    availableModels,
    currentModel,
    setConnectionStatus,
    selectConversation,
    setConversations,
    setRole,
    setRoles,
    fetchRoles,
    setModels,
    setModel,
  };
});
