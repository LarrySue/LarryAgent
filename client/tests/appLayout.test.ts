/**
 * AppLayout 组件测试（2026-08-21 三轮 UI 调整后的功能逻辑回归）
 *
 * 覆盖（功能逻辑，CSS 视觉不做断言）：
 * - 新建会话按钮（＋）→ startNewChat → store.selectConversation(null)
 *   （ChatView watch 到 null 显示欢迎页，这是调整新增的功能链路）
 * - 会话列表渲染：store.conversations 有数据 → 列表项 + 标题占位
 * - 空状态："暂无会话"
 * - 点击会话项 → selectConversation(conv.id)（含 active 高亮 class）
 * - 删除 RouterLink 导航后布局仍正常渲染（不依赖 vue-router）
 *
 * 依赖：Pinia store；AppLayout 不依赖 vue-router（已删 RouterLink），
 * 无需 Router 注入——这正是三轮调整的一个副作用，测试顺带钉住。
 */

import { describe, expect, it, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import AppLayout from "@/components/AppLayout.vue";
import { useAppStore } from "@/stores/app";

beforeEach(() => {
  setActivePinia(createPinia());
});

function mountLayout() {
  return mount(AppLayout, {
    global: {
      stubs: {
        // 子组件非本测试目标，stub 掉避免深度挂载副作用
        RoleSelector: true,
        ConnectionToast: true,
      },
    },
  });
}

describe("AppLayout 新建会话（＋）逻辑", () => {
  it("点击新建按钮 → store.currentConversationId 清空为 null", async () => {
    const store = useAppStore();
    store.setConversations([{ id: 1, title: "旧会话", updated_at: "x", is_archived: false }]);
    store.selectConversation(1);
    expect(store.currentConversationId).toBe(1);

    const wrapper = mountLayout();
    await wrapper.find(".new-chat-btn").trigger("click");

    expect(store.currentConversationId).toBe(null);
  });

  it("会话列表项存在时点击新建 → 仍清空", async () => {
    const store = useAppStore();
    store.setConversations([
      { id: 1, title: "A", updated_at: "x", is_archived: false },
      { id: 2, title: "B", updated_at: "x", is_archived: false },
    ]);
    store.selectConversation(2);

    const wrapper = mountLayout();
    await wrapper.find(".new-chat-btn").trigger("click");

    expect(store.currentConversationId).toBe(null);
  });
});

describe("AppLayout 会话列表", () => {
  it("无会话 → 显示空状态'暂无会话'", () => {
    const wrapper = mountLayout();
    expect(wrapper.find(".empty-state").exists()).toBe(true);
    expect(wrapper.find(".empty-text").text()).toBe("暂无会话");
  });

  it("有会话 → 渲染列表项，空标题显示'新会话'占位", () => {
    const store = useAppStore();
    store.setConversations([
      { id: 1, title: "会话一", updated_at: "x", is_archived: false },
      { id: 2, title: "", updated_at: "x", is_archived: false },
    ]);

    const wrapper = mountLayout();
    const items = wrapper.findAll(".conversation-item");
    expect(items).toHaveLength(2);
    expect(items[0].text()).toContain("会话一");
    expect(items[1].text()).toContain("新会话");
  });

  it("点击会话项 → selectConversation + active 高亮", async () => {
    const store = useAppStore();
    store.setConversations([
      { id: 1, title: "A", updated_at: "x", is_archived: false },
      { id: 2, title: "B", updated_at: "x", is_archived: false },
    ]);

    const wrapper = mountLayout();
    await wrapper.findAll(".conversation-item")[1].trigger("click");

    expect(store.currentConversationId).toBe(2);
    expect(wrapper.findAll(".conversation-item")[1].classes()).toContain("active");
  });

  it("当前选中会话标题显示在 TopBar", () => {
    const store = useAppStore();
    store.setConversations([{ id: 5, title: "当前话题", updated_at: "x", is_archived: false }]);
    store.selectConversation(5);

    const wrapper = mountLayout();
    expect(wrapper.find(".conversation-title").text()).toBe("当前话题");
  });

  it("未选中会话 → TopBar 显示应用名", () => {
    const wrapper = mountLayout();
    expect(wrapper.find(".app-title").text()).toBe("LarryAgent");
  });
});
