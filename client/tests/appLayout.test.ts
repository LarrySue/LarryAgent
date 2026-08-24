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

import { describe, expect, it, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import AppLayout from "@/components/AppLayout.vue";
import { useAppStore } from "@/stores/app";
import * as api from "@/api";

beforeEach(() => {
  setActivePinia(createPinia());
  vi.restoreAllMocks();
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

  it("未选中会话 → TopBar 显示'新会话'（第 5 轮行为：不再显示 LarryAgent 字样）", () => {
    const wrapper = mountLayout();
    expect(wrapper.find(".app-title").text()).toBe("新会话");
  });
});

// ---------------------------------------------------------------------------
// 三点菜单 + 行内重命名（2026-08-24 会话操作）
// ---------------------------------------------------------------------------

function conv(id: number, title: string) {
  return { id, title, updated_at: "x", is_archived: false };
}

/** mock api 模块：renameConversation 成功 + listConversations 返回新列表 */
function mockRenameApi() {
  const rename = vi.spyOn(api, "renameConversation").mockResolvedValue({} as never);
  const list = vi
    .spyOn(api, "listConversations")
    .mockResolvedValue([conv(1, "新标题"), conv(2, "B")] as never);
  return { rename, list };
}

describe("AppLayout 三点菜单", () => {
  it("悬停/点击 ⋮ → 菜单打开；再点 → 关闭", async () => {
    const store = useAppStore();
    store.setConversations([conv(1, "会话A")]);

    const wrapper = mountLayout();
    // 菜单默认不显示
    expect(wrapper.find(".conv-menu").exists()).toBe(false);

    // 点击 ⋮ 打开
    await wrapper.find(".conv-menu-btn").trigger("click");
    expect(wrapper.find(".conv-menu").exists()).toBe(true);
    expect(wrapper.find(".conv-menu-item").text()).toBe("重命名");

    // 再次点击关闭
    await wrapper.find(".conv-menu-btn").trigger("click");
    expect(wrapper.find(".conv-menu").exists()).toBe(false);
  });

  it("点击菜单外（document）→ 菜单关闭", async () => {
    const store = useAppStore();
    store.setConversations([conv(1, "会话A")]);

    const wrapper = mountLayout();
    await wrapper.find(".conv-menu-btn").trigger("click");
    expect(wrapper.find(".conv-menu").exists()).toBe(true);

    document.dispatchEvent(new Event("click"));
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".conv-menu").exists()).toBe(false);
  });
});

describe("AppLayout 行内重命名", () => {
  it("点重命名 → 进入编辑态（输入框聚焦选中）", async () => {
    const store = useAppStore();
    store.setConversations([conv(1, "原名")]);

    const wrapper = mountLayout();
    await wrapper.find(".conv-menu-btn").trigger("click");
    await wrapper.find(".conv-menu-item").trigger("click");

    const input = wrapper.find(".rename-input");
    expect(input.exists()).toBe(true);
    expect(input.element.value).toBe("原名");
    expect(wrapper.find(".conv-menu").exists()).toBe(false); // 菜单已关
  });

  it("Enter 确认 → 调 renameConversation + 重新拉列表", async () => {
    const { rename, list } = mockRenameApi();
    const store = useAppStore();
    store.setConversations([conv(1, "原名")]);

    const wrapper = mountLayout();
    await wrapper.find(".conv-menu-btn").trigger("click");
    await wrapper.find(".conv-menu-item").trigger("click");

    const input = wrapper.find(".rename-input");
    await input.setValue("新标题");
    await input.trigger("keydown.enter");
    await wrapper.vm.$nextTick();

    expect(rename).toHaveBeenCalledWith(1, "新标题");
    expect(list).toHaveBeenCalled();
    // 编辑态退出，列表用新数据
    expect(wrapper.find(".rename-input").exists()).toBe(false);
    expect(store.conversations[0].title).toBe("新标题");
  });

  it("Esc 取消 → 不调 API，恢复原标题", async () => {
    const { rename } = mockRenameApi();
    const store = useAppStore();
    store.setConversations([conv(1, "原名")]);

    const wrapper = mountLayout();
    await wrapper.find(".conv-menu-btn").trigger("click");
    await wrapper.find(".conv-menu-item").trigger("click");

    const input = wrapper.find(".rename-input");
    await input.setValue("乱改的标题");
    await input.trigger("keydown.esc");
    await wrapper.vm.$nextTick();

    expect(rename).not.toHaveBeenCalled();
    expect(wrapper.find(".rename-input").exists()).toBe(false);
    expect(wrapper.text()).toContain("原名");
  });

  it("空输入确认 → 视为取消，不调 API", async () => {
    const { rename } = mockRenameApi();
    const store = useAppStore();
    store.setConversations([conv(1, "原名")]);

    const wrapper = mountLayout();
    await wrapper.find(".conv-menu-btn").trigger("click");
    await wrapper.find(".conv-menu-item").trigger("click");

    const input = wrapper.find(".rename-input");
    await input.setValue("   ");
    await input.trigger("keydown.enter");
    await wrapper.vm.$nextTick();

    expect(rename).not.toHaveBeenCalled();
    expect(wrapper.find(".rename-input").exists()).toBe(false);
  });

  it("blur 失焦 → 确认重命名", async () => {
    const { rename } = mockRenameApi();
    const store = useAppStore();
    store.setConversations([conv(1, "原名")]);

    const wrapper = mountLayout();
    await wrapper.find(".conv-menu-btn").trigger("click");
    await wrapper.find(".conv-menu-item").trigger("click");

    const input = wrapper.find(".rename-input");
    await input.setValue("失焦改名");
    await input.trigger("blur");
    await wrapper.vm.$nextTick();

    expect(rename).toHaveBeenCalledWith(1, "失焦改名");
  });
});
