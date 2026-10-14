---
name: ps-search-evidence
description: PowerShell 通道的检索取证方法——首选原生 Grep/Glob 工具，固定行段与命令内嵌联动用 python -c 模板；含 PS 引号吞噬、0 命中对照组、编码三坑
---

# PS 通道检索取证

## 触发条件

- 场地 = 本机 Windows PowerShell 通道（Shell 工具是 PowerShell，**bash 形态的 `grep`/`rg`/`sed` 命令不可用**）
- 需要 grep -n 式「pattern + 文件 + 行号 + 原文」取证输出（改前/改后对照、残留巡检、引文摘录）

## 怎么做（按优先级）

### ① 首选：原生 Grep / Glob 工具（不占 Shell 通道）

跨文件/单文件检索一律先想原生工具：Grep（ripgrep 封装，支持 `file:line:content`、glob 过滤、count 模式）与 Glob（文件名模式）。**PS Shell 里没有 grep ≠ 本通道没有检索能力**——两轮后端任务曾因先入主「本通道无 grep」而全程绕道 python -c，次优。

### ② python -c 模板（固定行段取证 / 命令内嵌联动时用）

固定行段取证（等价 `sed -n 'A,Bp'`，输出 `行号:原文`）：

```
python -c "import pathlib;ls=pathlib.Path('<file>').read_text(encoding='utf-8').splitlines();[print(f'{i}:{ls[i-1].rstrip()}') for i in range(<A>,<B>+1)]"
```

单文件命中行（等价 `grep -n`）：

```
python -c "import pathlib;[print(f'{i}:{l.rstrip()}') for i,l in enumerate(pathlib.Path('<file>').read_text(encoding='utf-8').splitlines(),1) if '<pattern>' in l]"
```

## 已知坑

1. **PS 引号吞噬**：PS 原生传参会吃掉裸双引号 ⇒ 命令外壳用 PS 双引号、Python 内层一律单引号；pattern 含引号时先在草稿区拼好整条再贴入。
2. **判「0 命中」前必须先跑对照组**：先拿一个明知存在的 pattern 跑一次证明检索通道有效，再跑目标 pattern——否则「检索失效」与「确无残留」同形（假绿）。
3. **编码**：读文件显式 `encoding='utf-8'`；遇 GBK 老文件须显式换编码，不得让 UnicodeDecodeError 伪装成「文件不可读」。
