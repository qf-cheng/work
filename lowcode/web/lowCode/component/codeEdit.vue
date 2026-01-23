<template>
  <div class="code-editor">
    <div class="toolbar">
      <!-- <el-button type="button" class="btn" size="mini" :disabled="readOnly" @click="onFormat">格式化</el-button> -->
      <span v-if="error" class="error">JSON错误：{{ error }}</span>
    </div>
    <div ref="container" class="editor"></div>
  </div>
</template>

<script>
import * as monaco from "monaco-editor";

export default {
  name: "CodeEditor",
  model: { prop: "value", event: "input" },
  props: {
    value: { type: String, default: "" },
    height: { type: [Number, String], default: 420 },
    readOnly: { type: Boolean, default: false },
  },
  data() {
    return {
      editor: null,
      error: "",
      // eslint-disable-next-line vue/no-reserved-keys
      _suppressEmit: false,
    };
  },
  watch: {
    value(v) {
      if (!this.editor) return;
      const cur = this.editor.getValue();
      if (v !== cur) {
        this._suppressEmit = true;
        this.editor.setValue(v || "");
        this._suppressEmit = false;
        this._validateSilently();
      }
    },
    readOnly(v) {
      if (this.editor) this.editor.updateOptions({ readOnly: !!v });
    },
    height() {
      this.$nextTick(() => this._layout());
    },
  },
  mounted() {
    const el = this.$refs.container;
    el.style.height = typeof this.height === "number" ? `${this.height}px` : this.height;

    this.editor = monaco.editor.create(el, {
      value: this.value || "",
      language: "json",
      theme: "vs",
      minimap: { enabled: false },
      fontSize: 13,
      tabSize: 2,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      formatOnPaste: true,
      formatOnType: true,
      readOnly: this.readOnly,
    });

    this.editor.onDidChangeModelContent(() => {
      if (this._suppressEmit) return;
      const text = this.editor.getValue();
      this.$emit("input", text);
      this._validateSilently();
    });

    this._validateSilently();
    window.addEventListener("resize", this._layout);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this._layout);
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
  },
  methods: {
    _layout() {
      if (this.editor) this.editor.layout();
    },
    _validateSilently() {
      const ok = this.validate().ok;
      if (ok) this.error = "";
    },
    validate() {
      try {
        const text = this.editor ? this.editor.getValue() : (this.value || "");
        if (!text || !text.trim()) return { ok: true, value: null };
        const obj = JSON.parse(text);
        this.error = "";
        return { ok: true, value: obj };
      } catch (e) {
        const msg = (e && e.message) ? e.message : "Invalid JSON";
        this.error = msg;
        return { ok: false, message: msg };
      }
    },
    async format() {
      if (!this.editor) return;
      await this.editor.getAction("editor.action.formatDocument").run();
      this._validateSilently();
    },
    onFormat() {
      this.format();
    },
    focus() {
      if (this.editor) this.editor.focus();
    },
  },
};
</script>

<style scoped>
.code-editor { width: 100%; }
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.btn {
  padding: 6px 10px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.error { color: #d93025; font-size: 12px; }
.editor { border: 1px solid #e5e5e5; border-radius: 4px; }
</style>
