/**
 * ChatInput 组件快捷键与发送逻辑测试（P4.4 前端测试基建）
 *
 * 覆盖：
 * - Enter 发送（emit "send" + 清空输入框）
 * - Shift+Enter 不发送（换行）
 * - 空内容 / 纯空白 不发送
 * - disabled 时不发送
 * - 发送按钮点击发送；按钮 disabled 绑定
 * - 模型选择器 → store.setModel
 * 依赖 Pinia（useAppStore），测试内注入真实 store。
 */

import { describe, expect, it, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import ChatInput from "@/components/ChatInput.vue";
import { useAppStore } from "@/stores/app";

beforeEach(() => {
  setActivePinia(createPinia());
});

function mountInput(props: Record<string, unknown> = {}) {
  return mount(ChatInput, {
    props: { disabled: false, ...props },
  });
}

async function setText(wrapper: ReturnType<typeof mountInput>, value: string) {
  const textarea = wrapper.find("textarea");
  await textarea.setValue(value);
  return textarea;
}

describe("ChatInput 快捷键与发送", () => {
  it("Enter → emit send + 清空输入", async () => {
    const wrapper = mountInput();
    const textarea = await setText(wrapper, "你好");
    await textarea.trigger("keydown", { key: "Enter", shiftKey: false });

    expect(wrapper.emitted("send")).toEqual([["你好"]]);
    expect(textarea.element.value).toBe("");
  });

  it("Shift+Enter → 不发送", async () => {
    const wrapper = mountInput();
    const textarea = await setText(wrapper, "多行");
    await textarea.trigger("keydown", { key: "Enter", shiftKey: true });

    expect(wrapper.emitted("send")).toBeUndefined();
  });

  it("空内容 / 纯空白 → 不发送", async () => {
    const wrapper = mountInput();
    await setText(wrapper, "   ");
    await wrapper.find("textarea").trigger("keydown", { key: "Enter" });
    await wrapper.find(".send-btn").trigger("click");
    expect(wrapper.emitted("send")).toBeUndefined();
  });

  it("disabled → Enter 不发送、按钮禁用", async () => {
    const wrapper = mountInput({ disabled: true });
    const textarea = await setText(wrapper, "内容");
    await textarea.trigger("keydown", { key: "Enter" });

    expect(wrapper.emitted("send")).toBeUndefined();
    const btn = wrapper.find(".send-btn");
    expect(btn.attributes("disabled")).toBeDefined();
    expect(textarea.attributes("disabled")).toBeDefined();
  });

  it("发送按钮点击 → emit send（非空内容）", async () => {
    const wrapper = mountInput();
    await setText(wrapper, "按钮发送");
    await wrapper.find(".send-btn").trigger("click");

    expect(wrapper.emitted("send")).toEqual([["按钮发送"]]);
    expect(wrapper.find("textarea").element.value).toBe("");
  });

  it("按钮 disabled 与内容联动：空内容时禁用", async () => {
    const wrapper = mountInput();
    expect(wrapper.find(".send-btn").attributes("disabled")).toBeDefined();
    await setText(wrapper, "有内容");
    expect(wrapper.find(".send-btn").attributes("disabled")).toBeUndefined();
  });

  it("模型选择 → store.setModel", async () => {
    const store = useAppStore();
    store.setModels(["deepseek-chat", "qwen-plus"]);

    const wrapper = mountInput();
    expect(wrapper.find(".model-select").exists()).toBe(true);
    const options = wrapper
      .findAll(".model-select option")
      .map((o) => o.element.value);
    expect(options).toEqual(["deepseek-chat", "qwen-plus"]);

    await wrapper.find(".model-select").setValue("qwen-plus");
    expect(store.currentModel).toBe("qwen-plus");
  });
});
