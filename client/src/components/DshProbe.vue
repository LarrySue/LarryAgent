<script setup lang="ts">
/**
 * DSH-2.3 连通验证入口：经 DSH sdk profile 发一条消息并显示回包。
 *
 * 仅 Tauri 环境可用（依赖 tauri IPC command `dsh_prompt`）；纯浏览器
 * vite dev 下按钮置灰并提示。测试性质组件，后续 DSH-2.x 正式接入时替换。
 */
import { ref, computed } from "vue";
import { invoke } from "@tauri-apps/api/core";

interface DshPromptOutput {
  stdout: string;
  stderr: string;
  exit_code: number | null;
}

const inTauri = computed(() => "__TAURI_INTERNALS__" in window);
const open = ref(false);
const message = ref("Reply with exactly: hello from dsh");
const loading = ref(false);
const error = ref("");
const result = ref<DshPromptOutput | null>(null);

async function send() {
  if (loading.value) return;
  const text = message.value.trim();
  if (!text) return;
  loading.value = true;
  error.value = "";
  result.value = null;
  try {
    result.value = await invoke<DshPromptOutput>("dsh_prompt", { message: text });
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="dsh-probe">
    <button
      class="probe-btn"
      :title="inTauri ? 'DSH 连通测试（hello world）' : '需在 Tauri 环境中运行'"
      :disabled="!inTauri"
      @click="open = true"
    >
      <span class="probe-dot"></span>
      <span>DSH</span>
    </button>

    <div v-if="open" class="probe-overlay" @click.self="open = false">
      <div class="probe-modal">
        <h3 class="probe-title">DSH 直连测试 <span class="probe-sub">(sdk profile · stdio JSON-RPC)</span></h3>
        <p class="probe-desc">经 DSH 通道发一条消息并显示回包，验证 Vue/Tauri ↔ DSH 连通。</p>
        <textarea
          v-model="message"
          class="probe-input"
          rows="2"
          spellcheck="false"
          placeholder="输入要发给 DSH 的消息"
        ></textarea>
        <p v-if="error" class="probe-error">{{ error }}</p>
        <p v-else-if="loading" class="probe-hint">运行中（DSH runtime 启动 + 模型回复，约 10–30s）…</p>
        <p v-else-if="result && result.exit_code !== 0" class="probe-hint">
          exit code = {{ result.exit_code }}（见下方 stderr）
        </p>

        <div v-if="result" class="probe-result">
          <div class="probe-result-label">回复</div>
          <pre class="probe-out">{{ result.stdout || "(空)" }}</pre>
          <div v-if="result.stderr" class="probe-result-label">stderr</div>
          <pre v-if="result.stderr" class="probe-err">{{ result.stderr }}</pre>
        </div>

        <div class="probe-actions">
          <button class="probe-btn-act" :disabled="loading" @click="open = false">关闭</button>
          <button class="probe-btn-act primary" :disabled="loading || !message.trim()" @click="send">
            {{ loading ? "运行中…" : "发送" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.probe-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  background: transparent;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.probe-btn:hover:not(:disabled) {
  background: var(--color-accent-muted);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.probe-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.probe-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
}

.probe-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.probe-modal {
  width: 520px;
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.probe-title {
  margin: 0 0 var(--space-1);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.probe-sub {
  font-size: var(--text-xs);
  font-weight: 400;
  color: var(--color-text-muted);
}

.probe-desc {
  margin: 0 0 var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.probe-input {
  width: 100%;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  line-height: 1.5;
  resize: vertical;
  outline: none;
}

.probe-input:focus {
  border-color: var(--color-accent);
}

.probe-hint {
  margin: var(--space-2) 0 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.probe-error {
  margin: var(--space-2) 0 0;
  color: var(--color-error, #ef4444);
  font-size: var(--text-sm);
}

.probe-result {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
}

.probe-result-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-1);
}

.probe-out,
.probe-err {
  margin: 0 0 var(--space-2);
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-mono, monospace);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.probe-out {
  color: var(--color-text-primary);
}

.probe-err {
  color: var(--color-text-secondary);
}

.probe-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.probe-btn-act {
  padding: 6px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  transition: all var(--duration-fast);
}

.probe-btn-act:hover:not(:disabled) {
  border-color: var(--color-border-hover);
}

.probe-btn-act.primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

.probe-btn-act:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
