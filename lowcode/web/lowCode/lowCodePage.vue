<template>
  <div style="padding: 16px;">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px;">
      <div style="font-size: 18px; font-weight: 600;">
        {{ page.title || page.id || "LowCode Page" }}
      </div>
      <div style="opacity: .7; font-size: 12px;">
        {{ statusText }}
      </div>
    </div>

    <component
      :is="resolve(page.layout.type)"
      v-if="runtime && page.layout"
      :node="page.layout"
      :runtime="runtime"
    />

    <div v-else style="opacity:.7;">
      No layout
    </div>
  </div>
</template>

<script>
import Vue from "vue";

import { getPageByName } from "@/views/lowCode/api/common";

import { localPage } from "./localPages";
import { resolveComponent } from "./render";
import { createRuntime } from "./runtime/createRuntime";

export default {
  name: "LowCodePage",
  props: {
    schema: { type: Object, default: () => (null) },
    noPageId: { type: Boolean, default: false },
  },
  data() {
    return {
      page: {},
      runtime: null,
      statusText: "loading...",
      
    };
  },
  watch: {
    schema: {
      immediate: true,
      handler(newSchema) {
        if (!newSchema) return;
        this.applySchema(newSchema);
      },
    },
    "$route.params.name": {
      immediate: true,
      handler() {
        if (this.noPageId) return;
        this.load();
      },
    },
  },
  methods: {
    resolve(type) {
      return resolveComponent(type);
    },

    applySchema(schema) {
      this.statusText = "apply preview schema...";
      this.page = schema;

      const rt = createRuntime(schema, {
        onError: (err) => {
          console.error("[runtime error]", err);
          this.$message && this.$message.error(err.message || "runtime error");
        },
      });

      // ✅ 保持你现在的机制：root observable
      rt.root = Vue.observable(rt.root);

      this.runtime = rt;
      this.statusText = "ready";

      // 可选：受控模式也支持 onLoadAction（预览时很有用）
      if (schema.onLoadAction) {
        this.statusText = "loading data...";
        this.runtime.runAction(schema.onLoadAction)
          .then(() => (this.statusText = "ready"))
          .catch(() => (this.statusText = "ready"));
      }
    },

    async load() {
      this.statusText = "loading page schema...";
      const pageId = ['user_list', "admin_list"];
      
      const pageName = this.$route?.params?.name || pageId[1];

      // ✅ 先跑通：优先从后端读取；后端没有就用 demo
      let record = null;
      try {
        record = await getPageByName(pageName);
      } catch (e) {
        // ignore，fallback demo
      }

      // 约定：后端 page 表里 content 字段存整个 schema JSON
      const schema = record?.content || localPage(pageName);

      this.page = schema;

      this.applySchema(schema);
    },
  },
};
</script>
