<template>
  <div v-if="node" style="padding: 8px">
    <div style="font-weight: 600; margin-bottom: 8px">
      {{ node.type }}
      <span style="opacity: 0.6">{{ node._uid }}</span>
    </div>

    <!-- 通用 props -->
    <el-form label-width="90px" size="mini">
      <el-form-item label="type">
        <el-input :value="node.type" disabled />
      </el-form-item>

      <el-form-item v-if="hasField('text')" label="text">
        <el-input :value="localNode.text" @input="updateField('text', $event)" />
      </el-form-item>

      <el-form-item v-if="hasField('title')" label="title">
        <el-input :value="localNode.title" @input="updateField('title', $event)" />
      </el-form-item>

      <el-form-item v-if="hasField('label')" label="label">
        <el-input :value="localNode.label" @input="updateField('label', $event)" />
      </el-form-item>

      <el-form-item v-if="hasField('bind')" label="bind">
        <el-input
          :value="localNode.bind"
          placeholder="$data.xxx"
          @input="updateField('bind', $event)"
        />
      </el-form-item>

      <el-form-item v-if="hasField('bindVisible')" label="bindVisible">
        <el-input
          :value="localNode.bindVisible"
          placeholder="$ui.xxx"
          @input="updateField('bindVisible', $event)"
        />
      </el-form-item>

      <el-form-item v-if="hasField('bindPagination')" label="bindPagination">
        <el-input
          :value="localNode.bindPagination"
          placeholder="$data.xxx.pagination"
          @input="updateField('bindPagination', $event)"
        />
      </el-form-item>

      <!-- 事件：click/ok/change 等，先做成输入 actionId -->
      <el-form-item v-if="supportsOnClick" label="on.click">
        <el-input v-model="onClick" placeholder="actionId" @input="onSetClick" />
      </el-form-item>

      <el-form-item v-if="supportsOnOk" label="on.ok">
        <el-input v-model="onOk" placeholder="actionId" @input="onSetOk" />
      </el-form-item>

      <el-form-item v-if="supportsOnChange" label="on.change">
        <el-input v-model="onChange" placeholder="actionId" @input="onSetChange" />
      </el-form-item>

      <!-- props：结构化编辑 -->
      <el-divider content-position="left">props</el-divider>

      <div v-if="propDefs.length">
        <el-form-item v-for="def in propDefs" :key="def.key" :label="def.label || def.key">
          <div style="display: flex; align-items: center; gap: 8px">
            <template v-if="def.type === 'string'">
              <el-input
                :value="getPropValue(def)"
                :placeholder="def.placeholder || ''"
                clearable
                @input="(v) => onPropInput(def, v)"
              />
            </template>

            <template v-else-if="def.type === 'number'">
              <el-input-number
                :value="getNumberValue(def)"
                :min="def.min"
                :max="def.max"
                :step="def.step || 1"
                controls-position="right"
                @change="(v) => onPropInput(def, v)"
              />
            </template>

            <template v-else-if="def.type === 'boolean'">
              <el-switch :value="getPropValue(def)" @change="(v) => onPropInput(def, v)" />
            </template>

            <template v-else-if="def.type === 'select'">
              <el-select
                :value="getPropValue(def)"
                clearable
                @change="(v) => onPropInput(def, v)"
              >
                <el-option
                  v-for="opt in def.options || []"
                  :key="String(opt.value || opt)"
                  :label="opt.label || opt"
                  :value="opt.value === undefined ? opt : opt.value"
                />
              </el-select>
            </template>

            <template v-else-if="def.type === 'array'">
              <el-input
                :value="getArrayDraft(def)"
                placeholder="a,b,c"
                @input="(v) => onArrayInput(def, v)"
                @blur="() => applyArrayInput(def)"
              />
            </template>

            <el-button
              v-if="hasProp(def.key)"
              type="text"
              size="mini"
              @click="resetProp(def.key)"
            >
              清除
            </el-button>
          </div>
        </el-form-item>
      </div>
      <div v-else style="opacity: 0.6; font-size: 12px">暂无结构化 props</div>

      <div v-if="styleDefs.length">
        <el-divider content-position="left">style</el-divider>
        <el-form-item v-for="def in styleDefs" :key="'s-' + def.key" :label="def.label || def.key">
          <div style="display: flex; align-items: center; gap: 8px">
            <template v-if="def.type === 'select'">
              <el-select
                :value="getStyleValue(def)"
                clearable
                @change="(v) => onStyleInput(def, v)"
              >
                <el-option
                  v-for="opt in def.options || []"
                  :key="String(opt.value || opt)"
                  :label="opt.label || opt"
                  :value="opt.value === undefined ? opt : opt.value"
                />
              </el-select>
            </template>
            <template v-else>
              <el-input
                :value="getStyleValue(def)"
                :placeholder="def.placeholder || ''"
                clearable
                @input="(v) => onStyleInput(def, v)"
              />
            </template>
            <el-button
              v-if="hasStyle(def.key)"
              type="text"
              size="mini"
              @click="resetStyle(def.key)"
            >
              清除
            </el-button>
          </div>
        </el-form-item>
      </div>

      <el-divider content-position="left">props (advanced)</el-divider>

      <div style="display: flex; gap: 8px; margin-bottom: 8px">
        <el-input v-model="kv.key" placeholder="key" size="mini" style="width: 160px" />
        <el-input v-model="kv.val" placeholder="value (string)" size="mini" style="width: 220px" />
        <el-button size="mini" @click="addProp">添加/覆盖</el-button>
      </div>

      <div v-if="Object.keys(advancedProps).length" style="font-size: 12px">
        <div
          v-for="(v, k) in advancedProps"
          :key="k"
          style="display: flex; align-items: center; gap: 8px; margin: 4px 0"
        >
          <el-tag size="mini">{{ k }}</el-tag>
          <span style="opacity: 0.8">{{ v }}</span>
          <el-button type="text" size="mini" @click="removeProp(k)">删除</el-button>
        </div>
      </div>
    </el-form>
  </div>

  <div v-else style="padding: 12px; opacity: 0.7">请选择一个节点</div>
</template>

<script>
import Vue from 'vue'
import { NODE_PROP_DEFS } from './nodeTemplate'

const STYLE_DEFS = {
  Container: [
    {
      key: 'flexDirection',
      label: 'flexDirection',
      type: 'select',
      options: ['row', 'column', 'row-reverse', 'column-reverse']
    },
    {
      key: 'justifyContent',
      label: 'justifyContent',
      type: 'select',
      options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']
    },
    {
      key: 'alignItems',
      label: 'alignItems',
      type: 'select',
      options: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline']
    },
    { key: 'gap', label: 'gap', type: 'string', placeholder: '8px' },
    { key: 'padding', label: 'padding', type: 'string', placeholder: '0' },
    { key: 'margin', label: 'margin', type: 'string', placeholder: '0' },
    { key: 'width', label: 'width', type: 'string', placeholder: 'auto' },
    { key: 'height', label: 'height', type: 'string', placeholder: 'auto' }
  ]
}

export default {
  name: 'NodeInspector',
  props: {
    node: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      kv: { key: '', val: '' },
      onClick: '',
      onOk: '',
      onChange: '',
      propDrafts: {},
      localNode: {
        text: '',
        title: '',
        label: '',
        bind: '',
        bindVisible: '',
        bindPagination: ''
      }
    }
  },
  computed: {
    supportsOnClick() {
      return ['Button'].includes(this.node?.type)
    },
    supportsOnOk() {
      return ['Dialog'].includes(this.node?.type)
    },
    supportsOnChange() {
      return ['Pagination'].includes(this.node?.type)
    },
    propDefs() {
      return NODE_PROP_DEFS[this.node?.type] || []
    },
    propDefKeys() {
      return this.propDefs.map((item) => item.key)
    },
    styleDefs() {
      return STYLE_DEFS[this.node?.type] || []
    },
    advancedProps() {
      const props = this.node?.props || {}
      const exclude = new Set([...this.propDefKeys, 'style'])
      const result = {}
      Object.keys(props).forEach((key) => {
        if (!exclude.has(key)) result[key] = props[key]
      })
      return result
    }
  },
  watch: {
    node: {
      immediate: true,
      handler(n) {
        if (!n) return
        this.onClick = n?.on?.click || ''
        this.onOk = n?.on?.ok || ''
        this.onChange = n?.on?.change || ''
        this.localNode.text = n?.text || ''
        this.localNode.title = n?.title || ''
        this.localNode.label = n?.label || ''
        this.localNode.bind = n?.bind || ''
        this.localNode.bindVisible = n?.bindVisible || ''
        this.localNode.bindPagination = n?.bindPagination || ''
        this.syncPropDrafts()
      }
    }
  },
  methods: {
    emitChange() {
      this.$emit('change')
    },
    updateField(field, value) {
      Vue.set(this.node, field, value)
      this.localNode[field] = value
      this.emitChange()
    },
    hasField(field) {
      const t = this.node?.type
      if (!t) return false
      const map = {
        Button: ['text'],
        Input: ['bind'],
        Select: ['bind'],
        Table: ['bind'],
        Dialog: ['title', 'bindVisible'],
        FormItem: ['label'],
        Pagination: ['bindPagination']
      }
      const list = map[t] || []
      return list.includes(field)
    },

    ensureOn() {
      if (!this.node.on) Vue.set(this.node, 'on', {})
      return this.node.on
    },
    onSetClick() {
      const on = this.ensureOn()
      Vue.set(on, 'click', this.onClick)
      this.emitChange()
    },
    onSetOk() {
      const on = this.ensureOn()
      Vue.set(on, 'ok', this.onOk)
      this.emitChange()
    },
    onSetChange() {
      const on = this.ensureOn()
      Vue.set(on, 'change', this.onChange)
      this.emitChange()
    },

    ensureProps() {
      if (!this.node.props) Vue.set(this.node, 'props', {})
      return this.node.props
    },
    ensureStyle() {
      const props = this.ensureProps()
      if (!props.style || typeof props.style !== 'object' || Array.isArray(props.style)) {
        Vue.set(props, 'style', {})
      }
      return props.style
    },
    hasProp(key) {
      const props = this.node?.props
      return !!props && Object.prototype.hasOwnProperty.call(props, key)
    },
    hasStyle(key) {
      const style = this.node?.props?.style
      return !!style && Object.prototype.hasOwnProperty.call(style, key)
    },
    getPropValue(def) {
      const props = this.node?.props || {}
      if (Object.prototype.hasOwnProperty.call(props, def.key)) return props[def.key]
      return def.default !== undefined ? def.default : ''
    },
    getNumberValue(def) {
      const props = this.node?.props || {}
      if (Object.prototype.hasOwnProperty.call(props, def.key)) return Number(props[def.key])
      if (def.default !== undefined) return Number(def.default)
      return null
    },
    onPropInput(def, value) {
      const props = this.ensureProps()
      if (def.type === 'number') {
        if (value === '' || value === null || value === undefined) {
          Vue.delete(props, def.key)
        } else {
          Vue.set(props, def.key, Number(value))
        }
        this.emitChange()
        return
      }
      if (def.type === 'boolean') {
        Vue.set(props, def.key, !!value)
        this.emitChange()
        return
      }
      if (def.type === 'select') {
        if (value === '' || value === null || value === undefined) {
          Vue.delete(props, def.key)
        } else {
          Vue.set(props, def.key, value)
        }
        this.emitChange()
        return
      }
      if (def.type === 'string') {
        const next = value == null ? '' : String(value)
        if (!next) {
          Vue.delete(props, def.key)
        } else {
          Vue.set(props, def.key, next)
        }
        this.emitChange()
        return
      }
    },
    resetProp(key) {
      if (!this.node?.props) return
      Vue.delete(this.node.props, key)
      if (this.propDrafts[key] !== undefined) Vue.delete(this.propDrafts, key)
      this.emitChange()
    },
    getArrayDraft(def) {
      if (this.propDrafts[def.key] !== undefined) return this.propDrafts[def.key]
      const current = this.getPropValue(def)
      if (Array.isArray(current)) return current.join(', ')
      return ''
    },
    onArrayInput(def, value) {
      Vue.set(this.propDrafts, def.key, value)
    },
    applyArrayInput(def) {
      const text = (this.propDrafts[def.key] || '').trim()
      if (!text) {
        this.resetProp(def.key)
        return
      }

      let arr = null
      if (text.startsWith('[')) {
        try {
          arr = JSON.parse(text)
        } catch (e) {
          this.$message && this.$message.error('数组格式不正确')
          return
        }
      } else {
        arr = text.split(',').map((item) => item.trim()).filter(Boolean)
      }

      if (!Array.isArray(arr)) {
        this.$message && this.$message.error('数组格式不正确')
        return
      }

      if (def.itemType === 'number') {
        const numbers = arr.map((item) => Number(item))
        if (numbers.some((n) => Number.isNaN(n))) {
          this.$message && this.$message.error('数组需要数字')
          return
        }
        arr = numbers
      }

      const props = this.ensureProps()
      Vue.set(props, def.key, arr)
      this.emitChange()
    },
    getStyleValue(def) {
      const style = this.node?.props?.style || {}
      if (Object.prototype.hasOwnProperty.call(style, def.key)) return style[def.key]
      return ''
    },
    onStyleInput(def, value) {
      const style = this.ensureStyle()
      const next = value == null ? '' : String(value)
      if (!next) {
        Vue.delete(style, def.key)
      } else {
        Vue.set(style, def.key, next)
      }
      if (Object.keys(style).length === 0) {
        Vue.delete(this.node.props, 'style')
      }
      this.emitChange()
    },
    resetStyle(key) {
      const style = this.node?.props?.style
      if (!style) return
      Vue.delete(style, key)
      if (Object.keys(style).length === 0) {
        Vue.delete(this.node.props, 'style')
      }
      this.emitChange()
    },
    syncPropDrafts() {
      const next = {}
      this.propDefs.forEach((def) => {
        if (def.type === 'array') {
          const val = this.getPropValue(def)
          next[def.key] = Array.isArray(val) ? val.join(', ') : ''
        }
      })
      this.propDrafts = next
    },
    addProp() {
      const key = (this.kv.key || '').trim()
      if (!key) return
      if (key === 'style') {
        return this.$message && this.$message.warning('style 请用上面的 style 区域编辑')
      }
      if (this.propDefKeys.includes(key)) {
        return this.$message && this.$message.warning('该字段已支持结构化编辑')
      }
      const props = this.ensureProps()
      Vue.set(props, key, this.kv.val)
      this.kv.key = ''
      this.kv.val = ''
      this.emitChange()
    },
    removeProp(k) {
      if (!this.node?.props) return
      Vue.delete(this.node.props, k)
      if (this.propDrafts[k] !== undefined) Vue.delete(this.propDrafts, k)
      this.emitChange()
    }
  }
}
</script>
