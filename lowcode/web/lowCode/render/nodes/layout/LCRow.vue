<template>
  <div :style="styleObj">
    <component
      :is="resolve(child.type)"
      v-for="child in (node.children || [])"
      :key="child.id || child._key || JSON.stringify(child)"
      :node="child"
      :runtime="runtime"
      :ctx="ctx"
    />
  </div>
</template>

<script>
import { resolveComponent } from "@/views/lowCode/render";

export default {
  name: "LCRow",
  props: {
    node: { type: Object, required: true },
    runtime: { type: Object, required: true }, 
    ctx: { type: Object, default: () => ({}) }
  },
  computed: {
    styleObj() {
      const p = this.node.props || {};
      const gap = (p.gap ?? 8) + "px";
      return {
        display: "flex",
        flexWrap: p.wrap ? "wrap" : "nowrap",
        alignItems: p.align || "center",
        justifyContent: p.justify || "flex-start",
        gap,
      };
    },
  },
  methods: { resolve: resolveComponent },
};
</script>
