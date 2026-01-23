<template>
  <div style="display: flex; gap: 12px">
    <div style="width: 320px">
      <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px">
        <el-select v-model="addType" size="mini" placeholder="新增类型" style="width: 160px">
          <el-option v-for="t in types" :key="t" :label="t" :value="t" />
        </el-select>
        <el-button size="mini" :disabled="!selectedTreeNode" @click="addChildToSelected">
          加子节点
        </el-button>
        <el-button
          size="mini"
          :disabled="!selectedTreeNode || !selectedTreeNode.parentNode"
          type="danger"
          @click="removeSelected"
        >
          删除
        </el-button>
      </div>

      <div style="display: flex; gap: 8px; margin-bottom: 8px">
        <el-button size="mini" :disabled="!canMoveUp" @click="moveUp">上移</el-button>
        <el-button size="mini" :disabled="!canMoveDown" @click="moveDown">下移</el-button>
        <el-button size="mini" :disabled="!selectedTreeNode" @click="duplicate">复制</el-button>
      </div>

      <el-tree
        ref="tree"
        :data="treeData"
        node-key="id"
        :expand-on-click-node="false"
        highlight-current
        @current-change="onSelect"
      />
    </div>

    <div style="flex: 1; border-left: 1px solid #eee">
      <node-inspector :node="selectedRef" @change="emitNodeChange" />
    </div>
  </div>
</template>

<script>
import Vue from 'vue'

import { buildLayoutTree, nodeLabel } from './layoutOutline'
import NodeInspector from './nodeInspector.vue'
import { NODE_TPL } from './nodeTemplate'

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export default {
  name: 'LayoutTreeEditor',
  components: { NodeInspector },
  props: {
    schema: { type: Object, required: true }
  },
  data() {
    return {
      addType: 'Container',
      treeData: [],
      selectedTreeNode: null, // tree node object
      selectedRef: null, // schema node ref
      types: Object.keys(NODE_TPL)
    }
  },
  computed: {
    canMoveUp() {
      const n = this.selectedTreeNode
      if (!n || !n.parentNode?.ref) return false
      const arr = n.parentNode.ref.children || []
      const idx = arr.findIndex((x) => x && x._uid === n.ref._uid)
      return idx > 0
    },
    canMoveDown() {
      const n = this.selectedTreeNode
      if (!n || !n.parentNode?.ref) return false
      const arr = n.parentNode.ref.children || []
      const idx = arr.findIndex((x) => x && x._uid === n.ref._uid)
      return idx >= 0 && idx < arr.length - 1
    }
  },
  watch: {
    schema: {
      immediate: true,
      handler() {
        this.rebuildTree()
      }
    }
  },
  methods: {
    rebuildTree() {
      const rootLayout = this.schema?.layout

      if (!rootLayout) {
        this.treeData = []
        this.selectedTreeNode = null
        this.selectedRef = null
        return
      }

      const treeRoot = buildLayoutTree(rootLayout, null)
      this.treeData = treeRoot ? [treeRoot] : []
      this.$nextTick(() => {
        // 默认选中 root
        if (treeRoot) {
          this.$refs.tree && this.$refs.tree.setCurrentKey(treeRoot.id)
          this.onSelect(treeRoot)
        }
      })
    },

    onSelect(treeNode) {
      this.selectedTreeNode = treeNode
      this.selectedRef = treeNode ? treeNode.ref : null
    },

    ensureChildren(nodeRef) {
      if (!Array.isArray(nodeRef.children)) Vue.set(nodeRef, 'children', [])
      return nodeRef.children
    },

    addChildToSelected() {
      if (!this.selectedRef) return
      const parent = this.selectedRef
      const children = this.ensureChildren(parent)
      const newNode = NODE_TPL[this.addType] ? NODE_TPL[this.addType]() : NODE_TPL.Container()

      // 给新节点 uid，tree 才稳定
      if (!newNode._uid)
        newNode._uid = 'n_' + Date.now() + '_' + Math.random().toString(16).slice(2)

      children.push(newNode)
      this.emitChange()
      const treeNode = buildLayoutTree(newNode, this.selectedTreeNode)
      this.selectedTreeNode.children.push(treeNode)
      this.$nextTick(() => {
        // 选中新节点
        this.$refs.tree && this.$refs.tree.setCurrentKey(newNode._uid)
      })
    },

    removeSelected() {
      // 从 schema 中移除
      const n = this.selectedTreeNode
      if (!n || !n.parentNode.ref) return
      const parent = n.parentNode.ref
      const arr = parent.children || []
      const idx = arr.findIndex((x) => x && x._uid === n.ref._uid)
      if (idx >= 0) arr.splice(idx, 1)
      // 从 tree 中移除
      const treeParent = n.parentNode
      if (treeParent) {
        const treeArr = treeParent.children || []
        const treeIdx = treeArr.findIndex((x) => x && x.id === n.id)
        if (treeIdx >= 0) treeArr.splice(treeIdx, 1)
      }
      // sync schema
      this.emitChange()
    },

    moveUp() {
      // 从 schema 中移动
      const n = this.selectedTreeNode
      const parent = n.parentNode.ref
      const arr = parent.children || []
      const idx = arr.findIndex((x) => x && x._uid === n.ref._uid)
      if (idx > 0) {
        const tmp = arr[idx - 1]
        Vue.set(arr, idx - 1, arr[idx])
        Vue.set(arr, idx, tmp)
      }

      // 从 tree 中移动
      const treeParent = n.parentNode
      if (treeParent) {
        const treeArr = treeParent.children || []
        const treeIdx = treeArr.findIndex((x) => x && x.id === n.id)
        if (treeIdx > 0) {
          const tmp = treeArr[treeIdx - 1]
          treeArr[treeIdx - 1] = treeArr[treeIdx]
          treeArr[treeIdx] = tmp
          this.$nextTick(() => {if (treeParent.id) this.$refs.tree.updateKeyChildren(treeParent.id, treeArr.slice())})
        }
      }

      // sync schema
      this.emitChange()
    },

    moveDown() {
      // 从 schema 中移动
      const n = this.selectedTreeNode
      const parent = n.parentNode.ref
      const arr = parent.children || []
      const idx = arr.findIndex((x) => x && x._uid === n.ref._uid)
      if (idx >= 0 && idx < arr.length - 1) {
        const tmp = arr[idx + 1]
        Vue.set(arr, idx + 1, arr[idx])
        Vue.set(arr, idx, tmp)
      }
      // 从 tree 中移动
      const treeParent = n.parentNode
      if (treeParent) {
        const treeArr = treeParent.children || []
        const treeIdx = treeArr.findIndex((x) => x && x.id === n.id)
        if (treeIdx >= 0 && treeIdx < treeArr.length - 1) {
          const tmp = treeArr[treeIdx + 1]
          treeArr[treeIdx + 1] = treeArr[treeIdx]
          treeArr[treeIdx] = tmp
          this.$nextTick(() => {if (treeParent.id) this.$refs.tree.updateKeyChildren(treeParent.id, treeArr.slice())})
        }
      }
      // sync schema
      this.emitChange()
    },

    duplicate() {
      // 从 schema 中复制
      if (!this.selectedTreeNode) return
      const n = this.selectedTreeNode
      const nodeCopy = deepClone(n.ref)
      nodeCopy._uid = 'n_' + Date.now() + '_' + Math.random().toString(16).slice(2)

      if (!n.parentNode.ref) {
        // 复制 root：不建议，这里直接忽略
        return
      }
      const parent = n.parentNode.ref
      const arr = this.ensureChildren(parent)
      const idx = arr.findIndex((x) => x && x._uid === n.ref._uid)
      arr.splice(idx + 1, 0, nodeCopy)

      // 从 tree 中复制
      const treeParent = n.parentNode
      if (treeParent) {
        const treeArr = treeParent.children || []
        const treeIdx = treeArr.findIndex((x) => x && x.id === n.id)
        if (treeIdx >= 0) {
          treeArr.splice(treeIdx + 1, 0, buildLayoutTree(nodeCopy, treeParent))
        }
      }
      // sync schema
      this.emitChange()
    },

    emitChange() {
      this.$emit('change')
    },

    emitNodeChange() {
      this.selectedTreeNode.label = nodeLabel(this.selectedTreeNode.ref)
      this.$emit('change')
    }
  }
}
</script>
