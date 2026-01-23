<template>
  <el-button
    :type="node.props && node.props.type"
    :size="node.props && node.props.size"
    :loading="loading"
    @click="handleClick"
  >
    {{ node.text || (node.props && node.props.text) || "Button" }}
  </el-button>
</template>

<script>
export default {
  name: "LCButton",
  props: {
    node: { type: Object, required: true },
    runtime: { type: Object, required: true },
  },
  data() {
    return { loading: false };
  },
  methods: {
    async handleClick() {
      const actionId = this.node?.on?.click;
      if (!actionId) return;
      this.loading = true;
      try {
        await this.runtime.runAction(actionId);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
