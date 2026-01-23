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
  name: "LCCol",
  props: {
    node: { type: Object, required: true },
    runtime: { type: Object, required: true }, 
    ctx: { type: Object, default: () => ({}) }
  },
  computed: {
    styleObj() {
      const p = this.node.props || {};
      // width 优先；否则 flex=1
      if (p.width) return { width: p.width };
      if (p.flex) return { flex: String(p.flex) };
      return { flex: "1 1 auto", display: "flex", alignItems: p.align || "center" , justifyContent: p.justify || "flex-start" };
    },
  },
  methods: { resolve: resolveComponent },
};
</script>
