/**
 * 角色清单动态化测试（2026-09-03，Claude 测试）
 *
 * 覆盖：
 * - api.listRoles：mock fetch 成功 / HTTP 错误 / 非 JSON
 * - store：setRoles 后 currentRoleInfo 派生；空 roles / 当前角色不存在 → 兜底 default
 * - RoleSelector：从 store 读动态列表渲染；选中态与 modelValue 联动；
 *   不再有硬编码角色数组
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import { listRoles } from "@/api";
import { useAppStore, FALLBACK_ROLES } from "@/stores/app";
import RoleSelector from "@/components/RoleSelector.vue";

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// api.listRoles
// ---------------------------------------------------------------------------

describe("api.listRoles", () => {
  it("成功返回角色数组", async () => {
    const roles = [
      { key: "default", label: "通用", color: "#9CA3AF" },
      { key: "code", label: "编程", color: "#60A5FA" },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => roles })
    );
    await expect(listRoles()).resolves.toEqual(roles);
  });

  it("HTTP 错误 → 抛错误（走 handleResponse 的 detail 解析）", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "INTERNAL_ERROR", detail: "boom" }),
      })
    );
    await expect(listRoles()).rejects.toThrow("boom");
  });

  it("非 JSON 响应 → 抛 HTTP 状态错误", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError("not json");
        },
      })
    );
    await expect(listRoles()).rejects.toThrow("HTTP 502");
  });
});

// ---------------------------------------------------------------------------
// store：setRoles / currentRoleInfo / 兜底
// ---------------------------------------------------------------------------

describe("store roles", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("setRoles 后 currentRoleInfo 派生当前角色元数据", () => {
    const store = useAppStore();
    store.setRoles([
      { key: "default", label: "通用", color: "#9CA3AF" },
      { key: "code", label: "编程", color: "#60A5FA" },
    ]);
    store.setRole("code");
    expect(store.currentRoleInfo).toEqual({
      key: "code",
      label: "编程",
      color: "#60A5FA",
    });
  });

  it("当前角色不在清单 → currentRoleInfo 回退 default 兜底", () => {
    const store = useAppStore();
    store.setRoles([
      { key: "default", label: "通用", color: "#9CA3AF" },
      { key: "code", label: "编程", color: "#60A5FA" },
    ]);
    store.setRole("nonexistent");
    expect(store.currentRoleInfo.key).toBe("default");
  });

  it("setRoles 空数组 → 兜底 FALLBACK_ROLES", () => {
    const store = useAppStore();
    store.setRoles([]);
    expect(store.roles).toEqual(FALLBACK_ROLES);
  });

  it("roles 未加载（初始空）→ currentRoleInfo 兜底 default", () => {
    const store = useAppStore();
    expect(store.roles).toEqual([]);
    expect(store.currentRoleInfo).toEqual(FALLBACK_ROLES[0]);
  });

  it("fetchRoles 失败 → 兜底 FALLBACK_ROLES", async () => {
    const store = useAppStore();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );
    await store.fetchRoles();
    expect(store.roles).toEqual(FALLBACK_ROLES);
  });

  it("type Role 已动态化（string），可承载后端任意新角色 key", () => {
    const store = useAppStore();
    store.setRole("science");
    expect(store.currentRole).toBe("science");
    // 编译期联合类型消失由 grep 验证（见交付说明）
  });
});

// ---------------------------------------------------------------------------
// RoleSelector：动态渲染 + 选中联动
// ---------------------------------------------------------------------------

describe("RoleSelector", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  async function openDropdown(wrapper: ReturnType<typeof mount>) {
    await wrapper.find(".selector-trigger").trigger("click");
  }

  it("从 store 读动态列表渲染（含 code——此前硬编码选不到的）", async () => {
    const store = useAppStore();
    store.setRoles([
      { key: "default", label: "通用", color: "#9CA3AF" },
      { key: "code", label: "编程", color: "#60A5FA" },
      { key: "health", label: "健康", color: "#34D399" },
    ]);
    const wrapper = mount(RoleSelector, { props: { modelValue: "default" } });
    await openDropdown(wrapper);
    const text = wrapper.text();
    expect(text).toContain("通用");
    expect(text).toContain("编程");
    expect(text).toContain("健康");
    // 后端新角色 key（如 science）动态进入下拉——验证无硬编码白名单
    store.setRoles([
      ...store.roles,
      { key: "science", label: "科学", color: "#A78BFA" },
    ]);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("科学");
  });

  it("trigger 显示当前选中角色的 label", () => {
    const store = useAppStore();
    store.setRoles([
      { key: "default", label: "通用", color: "#9CA3AF" },
      { key: "code", label: "编程", color: "#60A5FA" },
    ]);
    const wrapper = mount(RoleSelector, { props: { modelValue: "code" } });
    expect(wrapper.find(".role-label").text()).toBe("编程");
  });

  it("点击角色项 → emit update:modelValue 且勾选标记联动", async () => {
    const store = useAppStore();
    store.setRoles([
      { key: "default", label: "通用", color: "#9CA3AF" },
      { key: "health", label: "健康", color: "#34D399" },
    ]);
    const wrapper = mount(RoleSelector, { props: { modelValue: "default" } });
    await openDropdown(wrapper);
    // 当前选中 default 有 ✓
    expect(wrapper.find(".check").exists()).toBe(true);
    // 点击 health 项
    const items = wrapper.findAll(".dropdown-item");
    const healthItem = items.find((i) => i.text().includes("健康"))!;
    await healthItem.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([["health"]]);
  });

  it("store roles 为空 → 本地 FALLBACK 防白屏（至少显示 default）", async () => {
    const wrapper = mount(RoleSelector, { props: { modelValue: "default" } });
    await openDropdown(wrapper);
    expect(wrapper.text()).toContain("通用"); // FALLBACK_ROLES[0].label
  });
});
