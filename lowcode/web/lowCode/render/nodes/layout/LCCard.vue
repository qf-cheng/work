<template>
  <el-card :shadow="node.props?.shadow || 'never'">
    <component
      :is="resolve(child.type)"
      v-for="child in (node.children || [])"
      :key="child.id || child._key || JSON.stringify(child)"
      :node="child"
      :runtime="runtime"
      :ctx="ctx"
    />
  </el-card>
</template>

<script>
import { resolveComponent } from "@/views/lowCode/render";
export default {
  name: "LCCard",
  props: {
    node: { type: Object, required: true },
    runtime: { type: Object, required: true }, 
    ctx: { type: Object, default: () => ({}) }
  },
  methods: { resolve: resolveComponent },
};
</script>
