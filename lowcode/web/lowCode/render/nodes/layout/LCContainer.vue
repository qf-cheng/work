<template>
  <div :style="style">
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
  name: "LCContainer",
  props: {
    node: { type: Object, required: true },
    runtime: { type: Object, required: true },
    ctx: { type: Object, default: () => ({}) }
  },
  computed: {
    style() {
      const p = this.node.props || {};
      const style = {
        display: "flex",
        flexDirection: "row",
        // alignItems: "center",
        justifyContent: "flex-start",
        gap: "8px",
        padding: "0px",
        ...p.style || {},
      };
      for (const key in p) {
        if (p[key]) switch (key) {
          case 'justify':
            style.justifyContent = p[key];
            break;
          default:
            if (style[key]) style[key] = p[key];
        }
      }
      return style;
    }
  },
  methods: { resolve: resolveComponent }
};
</script>
