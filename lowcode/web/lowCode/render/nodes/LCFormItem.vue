<template>
  <el-form-item :label="node.label || node.props?.label">
    <component
      :is="resolve(child.type)"
      v-for="child in (node.children || [])"
      :key="child.id || child._key || JSON.stringify(child)"
      :node="child"
      :runtime="runtime"
    />
  </el-form-item>
</template>

<script>
import { resolveComponent } from "@/views/lowCode/render";
export default {
  name: "LCFormItem",
  props: { 
    node: { type: Object, default: () => ({}) }, 
    runtime: { type: Object, default: () => ({}) }
  },
  methods: {
    resolve(type) {
      return resolveComponent(type);
    },
  },
};
</script>