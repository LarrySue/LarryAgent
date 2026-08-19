/**
 * ToolCallCard 组件状态机测试（P4.4 前端测试基建）
 *
 * 覆盖：
 * - pending：spinner + "执行中..." + 等待结果区，无结果摘要
 * - success：✅ + "执行成功" + 结果摘要（含空结果回退 "(无输出)"）
 * - error：❌ + "执行失败" + 结果摘要
 * - 折叠/展开切换（toggle）
 * - args JSON 解析展示（合法 JSON 美化 / 非法 JSON 原样）
 * 依赖 Pinia（useAppStore），测试内注入真实 store。
 */

import { describe, expect, it, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import ToolCallCard from "@/components/ToolCallCard.vue";

beforeEach(() => {
  setActivePinia(createPinia());
});

function mountCard(props: Record<string, unknown>) {
  return mount(ToolCallCard, {
    props: {
      name: "shell",
      round: 2,
      status: "pending",
      ...props,
    },
  });
}

describe("ToolCallCard 状态机", () => {
  it("pending：显示 spinner + 执行中，无结果摘要区", () => {
    const wrapper = mountCard({ status: "pending" });
    expect(wrapper.find(".spinner").exists()).toBe(true);
    expect(wrapper.find(".status-icon").exists()).toBe(false);
    expect(wrapper.text()).toContain("执行中...");
    expect(wrapper.text()).toContain("等待结果...");
    expect(wrapper.find(".result-content").exists()).toBe(false);
  });

  it("success：显示 ✅ + 执行成功 + 结果摘要", () => {
    const wrapper = mountCard({ status: "success", result: "echo ok" });
    expect(wrapper.find(".spinner").exists()).toBe(false);
    expect(wrapper.find(".status-icon").text()).toBe("✅");
    expect(wrapper.text()).toContain("执行成功");
    expect(wrapper.find(".result-content").text()).toBe("echo ok");
  });

  it("success 但结果为空 → 显示 '(无输出)'", () => {
    const wrapper = mountCard({ status: "success", result: "" });
    expect(wrapper.find(".result-content").text()).toBe("(无输出)");
  });

  it("error：显示 ❌ + 执行失败 + 结果摘要", () => {
    const wrapper = mountCard({ status: "error", result: "command failed" });
    expect(wrapper.find(".status-icon").text()).toBe("❌");
    expect(wrapper.text()).toContain("执行失败");
    expect(wrapper.find(".result-content").text()).toBe("command failed");
  });

  it("点击 header 折叠/展开切换", async () => {
    const wrapper = mountCard({ status: "success" });
    expect(wrapper.find(".tool-body").exists()).toBe(true);
    await wrapper.find(".tool-header").trigger("click");
    expect(wrapper.find(".tool-body").exists()).toBe(false);
    await wrapper.find(".tool-header").trigger("click");
    expect(wrapper.find(".tool-body").exists()).toBe(true);
  });

  it("args 为合法 JSON → 美化展示", () => {
    const wrapper = mountCard({
      status: "success",
      args: '{"action":"read","path":"a.txt"}',
    });
    const text = wrapper.find(".args-content").text();
    expect(text).toContain('"action"');
    expect(text).toContain("a.txt");
  });

  it("args 为非法 JSON → 原样展示", () => {
    const wrapper = mountCard({ status: "success", args: "plain text args" });
    expect(wrapper.find(".args-content").text()).toBe("plain text args");
  });

  it("无 args → 不渲染参数区", () => {
    const wrapper = mountCard({ status: "success" });
    expect(wrapper.find(".args-content").exists()).toBe(false);
  });
});
