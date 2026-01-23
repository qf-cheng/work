<template>
  <div style="display: flex; gap: 12px">
    <!-- 左侧：scope + tree -->
    <div style="width: 320px">
      <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px">
        <el-radio-group v-model="scope" size="mini" @change="onScopeChange">
          <el-radio-button v-for="s in scopeEnum" :key="s" :label="s">{{ s }}</el-radio-button>
        </el-radio-group>

        <el-button size="mini" @click="addRootKey">新增字段</el-button>
      </div>

      <el-input
        v-model="filter"
        size="mini"
        placeholder="过滤 key"
        clearable
        style="margin-bottom: 8px"
      />

      <el-tree
        ref="tree"
        :data="treeData"
        node-key="id"
        highlight-current
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        @current-change="onSelect"
      />
    </div>

    <!-- 右侧：选中节点编辑 -->
    <div style="flex: 1; border-left: 1px solid #eee; padding-left: 12px">
      <div v-if="!selected" style="opacity: 0.7; padding: 12px">请选择一个字段</div>

      <div v-else>
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          "
        >
          <div style="font-weight: 600">
            {{ selected.key }}
            <span style="opacity: 0.6; font-size: 12px">{{ selectedPath }}</span>
          </div>
          <div style="display: flex; gap: 8px">
            <el-button size="mini" @click="renameKey">重命名</el-button>
            <el-button
              size="mini"
              type="danger"
              :disabled="selected.isRootScope"
              @click="removeKey"
            >
              删除
            </el-button>
          </div>
        </div>

        <el-form label-width="90px" size="mini">
          <el-form-item label="type">
            <el-select v-model="editType" size="mini" style="width: 200px" @change="applyType">
              <el-option v-for="t in types" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>

          <!-- primitive -->
          <template v-if="isPrimitiveType(editType)">
            <el-form-item label="value">
              <el-input
                v-if="editType === 'string'"
                v-model="editValueStr"
                placeholder="string"
                @input="applyValue"
              />
              <el-input
                v-else-if="editType === 'number'"
                v-model="editValueStr"
                placeholder="number"
                @input="applyValue"
              />
              <el-switch
                v-else-if="editType === 'boolean'"
                v-model="editValueBool"
                @change="applyValue"
              />
              <el-tag v-else size="mini">null</el-tag>
            </el-form-item>
          </template>

          <!-- object / array -->
          <template v-else>
            <el-form-item label="操作">
              <el-button size="mini" :disabled="editType !== 'object'" @click="addChildKey">
                新增子字段
              </el-button>
              <el-button size="mini" :disabled="editType !== 'array'" @click="pushArrayItem">
                push item
              </el-button>
              <el-button size="mini" @click="clearContainer">清空</el-button>
            </el-form-item>

            <div style="opacity: 0.7; font-size: 12px; margin-top: 6px">
              object/array 仅通过树结构编辑（新增/删除/重命名）与 push 操作维护
            </div>
          </template>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'

import { buildChildren, newNoTypeNode, summary,typeOfVal } from './rootInitOutline'

export default {
  name: 'RootInitEditor',
  props: {
    schema: { type: Object, required: true }
  },
  data() {
    return {
      scope: '$data',
      scopeEnum: ['$data', '$ui'],
      filter: '',
      treeData: [],
      selected: null, // { id,key, parentObjRef, isArray, arrayIndex, valueRef }
      editType: 'string',
      editValueStr: '',
      editValueBool: false,

      types: ['string', 'number', 'boolean', 'null', 'object', 'array']
    }
  },
  computed: {
    selectedPath() {
      if (!this.selected) return ''
      return `${this.scope}.${this.selected.key}`
    }
  },
  watch: {
    filter(v) {
      this.$refs.tree && this.$refs.tree.filter(v)
    },
    schema: {
      immediate: true,
      handler() {
        this.ensureRootInit()
        this.rebuildTree()
      }
    },
    scope() {
      this.rebuildTree()
    }
  },
  methods: {
    ensureRootInit() {
      for (const scope of this.scopeEnum) {
        if (!this.schema.rootInit[scope]) Vue.set(this.schema.rootInit, scope, {})
      }
    },

    getScopeObj() {
      this.ensureRootInit()
      return this.schema.rootInit[this.scope]
    },

    filterNode(value, data) {
      if (!value) return true
      return (data.label || '').toLowerCase().includes(value.toLowerCase())
    },

    rebuildTree() {
      const rootObj = this.getScopeObj()
      const root = {
        id: this.scope, // 固定
        label: this.scope,
        key: this.scope,
        isRootScope: true,
        parentNode: null,
        valueRef: rootObj
      }
      root.children = buildChildren(rootObj, root)
      this.treeData = [root]

      this.$nextTick(() => {
        this.$refs.tree && this.$refs.tree.setCurrentKey(this.scope)
        this.onSelect(root)
      })
    },

    onSelect(node) {
      if (!node) {
        this.selected = null
        return
      }
      // 根 scope 不允许删除/重命名
      this.selected = node

      // 初始化编辑面板
      const v = node.isRootScope ? this.getScopeObj() : node.valueRef
      this.editType = typeOfVal(v)

      if (this.editType === 'boolean') this.editValueBool = !!v
      else this.editValueStr = v == null ? '' : String(v)
    },

    onScopeChange() {
      this.selected = null
      this.rebuildTree()
    },

    emitChange() {
      this.$emit('change')
    },

    // ---------- CRUD: keys ----------
    addRootKey() {
      const scopeObj = this.getScopeObj()
      this.$prompt('字段名', '新增字段', { inputValue: 'newKey' })
        .then(({ value }) => {
          const k = (value || '').trim()
          if (!k) return
          if (scopeObj[k] !== undefined) return this.$message.error('key 已存在')
          Vue.set(scopeObj, k, '')
          const newNode = newNoTypeNode(k, '', scopeObj)
          this.selected.children.push(newNode)

          this.emitChange()

          // this.rebuildTree()
        })
        .catch(() => {})
    },

    addChildKey() {
      if (!this.selected) return
      const v = this.selected.isRootScope ? this.getScopeObj() : this.selected.valueRef
      if (typeOfVal(v) !== 'object') return

      this.$prompt('子字段名', '新增子字段', { inputValue: 'childKey' })
        .then(({ value }) => {
          const k = (value || '').trim()
          if (!k) return
          if (v[k] !== undefined) return this.$message.error('key 已存在')
          Vue.set(v, k, '')
          const newNode = newNoTypeNode(k, '', v)
          this.selected.children.push(newNode)
          this.emitChange()
          // this.rebuildTree()
        })
        .catch(() => {})
    },

    renameKey() {
      if (!this.selected || this.selected.isRootScope) return
      const parent = this.selected.parentNode.valueRef
      const oldKey = this.selected.key
      if (!parent || Array.isArray(parent)) return this.$message.error('数组下标不支持重命名')

      this.$prompt('新字段名', '重命名', { inputValue: oldKey })
        .then(({ value }) => {
          const nk = (value || '').trim()
          if (!nk || nk === oldKey) return
          if (parent[nk] !== undefined) return this.$message.error('新 key 已存在')

          const oldVal = parent[oldKey]
          Vue.set(parent, nk, oldVal)
          Vue.delete(parent, oldKey)
          this.selected.key = nk
          this.selected.label = `${nk} : ${summary(oldVal)}`
          this.emitChange()
          // this.rebuildTree()
        })
        .catch(() => {})
    },

    removeKey() {
      if (!this.selected || this.selected.isRootScope) return
      const parentNode = this.selected.parentNode
      const parent = parentNode.valueRef

      if (!parent) return

      // 数组 index 删除
      if (Array.isArray(parent)) {
        const idx = this.selected.arrayIndex
        if (typeof idx === 'number') parent.splice(idx, 1)
      } else {
        Vue.delete(parent, this.selected.key)
      }
      this.emitChange()
      parentNode.children = parentNode.children.filter((child) => child.id !== this.selected.id)
      parentNode.label = `${parentNode.key} : ${summary(parent)}`
      if (Array.isArray(parent))
        parentNode.children.forEach((child, index) => {
          const key = `[${index}]`
          child.key = key
          child.arrayIndex = index
          child.label = `${key} : ${summary(child.valueRef)}`
        })
      this.onSelect()
    },

    // ---------- value editing ----------
    isPrimitiveType(t) {
      return ['string', 'number', 'boolean', 'null'].includes(t)
    },

    applyType() {
      if (!this.selected) return
      // 根 scope 的类型不允许变（必须 object）
      if (this.selected.isRootScope) {
        this.editType = 'object'
        return
      }
      const selectedNode = this.selected
      const parent = selectedNode.parentNode.valueRef
      const key = this.selected.isArrayIndex ? this.selected.arrayIndex : this.selected.key

      let newVal = ''
      if (this.editType === 'string') newVal = ''
      else if (this.editType === 'number') newVal = 0
      else if (this.editType === 'boolean') newVal = false
      else if (this.editType === 'null') newVal = null
      else if (this.editType === 'object') newVal = {}
      else if (this.editType === 'array') newVal = []

      Vue.set(parent, key, newVal)

      this.emitChange()
      // this.rebuildTree()

      const treeIndex = selectedNode.parentNode.children.findIndex((x) => x.id === selectedNode.id)
      const newNode = newNoTypeNode(key, newVal, selectedNode.parentNode)
      selectedNode.parentNode.children.splice(treeIndex, 1, newNode)
      this.onSelect(newNode)
      // this.selected = newNode
    },

    applyValue() {
      if (!this.selected || this.selected.isRootScope) return
      const selectedNode = this.selected
      const parent = selectedNode.parentNode.valueRef
      const key = this.selected.isArrayIndex ? this.selected.arrayIndex : this.selected.key

      let v = null
      if (this.editType === 'string') v = this.editValueStr
      else if (this.editType === 'number') v = Number(this.editValueStr || 0)
      else if (this.editType === 'boolean') v = !!this.editValueBool
      else if (this.editType === 'null') v = null

      Vue.set(parent, key, v)
      this.emitChange()

      this.selected.label = `${key} : ${summary(v)}`
    },

    pushArrayItem() {
      if (!this.selected) return
      const v = this.selected.isRootScope ? this.getScopeObj() : this.selected.valueRef
      if (!Array.isArray(v)) return

      v.push('')
      this.emitChange()
      const selectedNode = this.selected
      const idx = v.length - 1
      const k = `[${idx}]`
      const node = newNoTypeNode(k, '', selectedNode)
      node.isArrayIndex = true
      node.arrayIndex = idx
      selectedNode.children.push(node)
      this.selected.label = `${this.selected.key} : ${summary(v)}`
    },

    clearContainer() {
      if (!this.selected) return

      if (this.selected.isRootScope) {
        // 清空 scope object
        const scopeObj = this.getScopeObj()
        Object.keys(scopeObj).forEach((k) => Vue.delete(scopeObj, k))
        this.emitChange()
        this.rebuildTree()
        return
      }

      // const parentNode = this.selected.parentNode
      // const key = this.selected.isArrayIndex ? this.selected.arrayIndex : this.selected.key
      const cur = this.selected.valueRef
      const t = typeOfVal(cur)
      if (t === 'object') {
        Object.keys(cur).forEach((k) => Vue.delete(cur, k))
        const spliceLength = this.selected.children.length
        this.selected.children.splice(0, spliceLength)
      } else if (t === 'array') {
        cur.splice(0, cur.length)
        const spliceLength = this.selected.children.length
        this.selected.children.splice(0, spliceLength)
      }
      this.selected.label = `${this.selected.key} : ${summary([])}`
      this.emitChange()
    }
  }
}
</script>
