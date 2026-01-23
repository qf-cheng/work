<template>
  <el-dialog
    :title="node.title || node.props?.title || ''"
    :visible.sync="visible"
    :width="node.props?.width || '520px'"
    @close="handleClose"
  >
    <component
      :is="resolve(child.type)"
      v-for="child in node.children || []"
      :key="child.id || child._key || JSON.stringify(child)"
      :node="child"
      :runtime="runtime"
    />

    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleOk">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { resolveComponent } from '@/views/lowCode/render'

export default {
  name: 'LCDialog',
  props: { 
    node: { type: Object, default: () => ({}) }, 
    runtime: { type: Object, default: () => ({}) }
  },
  data() {
    return { loading: false }
  },
  computed: {
    // bindVisible: "$ui.xxx"
    visible: {
      get() {
        const p = this.node.bindVisible
        return p ? !!this.runtime.getValue(p) : false
      },
      set(v) {
        const p = this.node.bindVisible
        if (p) this.runtime.setValue(p, !!v)
      }
    }
  },
  methods: {
    resolve(type) {
      return resolveComponent(type)
    },
    handleClose() {
      // 可选：关闭时清理表单
      const clear = this.node.on?.close
      if (clear) this.runtime.runAction(clear)
    },
    async handleOk() {
      const actionId = this.node.on?.ok
      if (!actionId) {
        this.visible = false
        return
      }
      this.loading = true
      try {
        await this.runtime.runAction(actionId)
        this.visible = false
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
