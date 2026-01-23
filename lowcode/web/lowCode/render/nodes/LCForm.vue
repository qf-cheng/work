<template>
  <el-form :label-width="node.props?.labelWidth || '100px'">
    <component
      :is="resolve(child.type)"
      v-for="child in (node.children || [])"
      :key="child.id || child._key || JSON.stringify(child)"
      :node="child"
      :runtime="runtime"
    />
  </el-form>
</template>

<script>
import { resolveComponent } from "@/views/lowCode/render";
export default {
  name: "LCForm",
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
