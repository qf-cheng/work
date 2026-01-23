import Vue from 'vue'

import {
  createResource,
  detailResource,
  listResource,
  removeResource,
  updateResource
} from '@/views/lowCode/api/common'

function isObject(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

export function getByPath(obj, path) {
  if (!path) return undefined
  const p = path.startsWith('$') ? path : `$data.${path}`
  const keys = p.split('.').filter(Boolean)
  let cur = obj
  for (const k of keys) {
    if (cur == null) return undefined
    cur = cur[k]
  }
  return cur
}

export function setByPath(obj, path, value) {
  if (!path) return
  const p = path.startsWith('$') ? path : `$data.${path}`
  const keys = p.split('.').filter(Boolean)
  let cur = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    if (!isObject(cur[k])) Vue.set(cur, k, {})
    cur = cur[k]
  }
  Vue.set(cur, keys[keys.length - 1], value)
}

function resolveMaybePath(root, v, ctx) {
  if (typeof v === 'string') {
    if (v.startsWith('$ctx.')) {
      const p = v.replace('$ctx.', '')
      return p.split('.').reduce((o, k) => (o ? o[k] : undefined), ctx)
    }
    if (v.startsWith('$')) {
      return getByPath(root, v)
    }
  }
  return v
}

export function createRuntime(pageSchema, { onError } = {}) {
  const root = {
    $meta: { pageId: pageSchema?.id || '', ts: Date.now() },
    $data: {},
    $ui: {},
    $tmp: {}
  }

  if (pageSchema?.rootInit?.$data) root.$data = pageSchema.rootInit.$data
  if (pageSchema?.rootInit?.$ui) root.$ui = pageSchema.rootInit.$ui
  if (pageSchema?.rootInit?.$tmp) root.$tmp = pageSchema.rootInit.$tmp

  const actions = pageSchema?.actions || {}

  async function runAction(actionId, ctx = {}) {
    const def = actions[actionId]
    if (!def) throw new Error(`action not found: ${actionId}`)

    try {
      // 1) flow：顺序执行
      if (def.type === 'flow') {
        const steps = Array.isArray(def.steps) ? def.steps : []
        let last = null
        for (const step of steps) {
          // step 可以是 actionId 字符串，也可以是内联 action 定义
          if (typeof step === 'string') {
            last = await runAction(step, ctx)
          } else if (step && typeof step === 'object') {
            last = await runInline(step, ctx)
          }
        }
        return last
      }

      if (def.type === 'branch') {
        const v = resolveMaybePath(root, def.value, ctx)
        const cases = def.cases || {}
        const next = cases[String(v)] || def.default
        if (!next) return null
        return await runAction(next, ctx)
      }

      // 2) 资源 CRUD
      if (def.type === 'resource.list') {
        const resource = def.resource
        const to = def.to || '$data.result'
        const pageNo = resolveMaybePath(root, def.pageNo ?? 1, ctx) ?? 1
        const pageSize = resolveMaybePath(root, def.pageSize ?? 20, ctx) ?? 20
        const condition = resolveMaybePath(root, def.condition ?? {}, ctx) || {}
        const result = await listResource(resource, { pageNo, pageSize, condition })
        setByPath(root, to, result)
        return result
      }

      if (def.type === 'resource.detail') {
        const resource = def.resource
        const id = resolveMaybePath(root, def.id, ctx)
        if (!id) throw new Error('detail requires id')
        const to = def.to || '$data.detail'
        const result = await detailResource(resource, id)
        setByPath(root, to, result.doc)
        return result
      }

      if (def.type === 'resource.create') {
        const resource = def.resource
        const data = resolveMaybePath(root, def.data, ctx) || {}
        const result = await createResource(resource, data)
        if (def.to) setByPath(root, def.to, result)
        return result
      }

      if (def.type === 'resource.update') {
        const resource = def.resource
        const id = resolveMaybePath(root, def.id, ctx)
        const data = resolveMaybePath(root, def.data, ctx) || {}
        if (!id) throw new Error('update requires id')
        console.log('data: ', data)
        const result = await updateResource(resource, id, data)
        if (def.to) setByPath(root, def.to, result)
        return result
      }

      if (def.type === 'resource.remove') {
        const resource = def.resource
        const id = resolveMaybePath(root, def.id, ctx)
        if (!id) throw new Error('remove requires id')
        const result = await removeResource(resource, id)
        if (def.to) setByPath(root, def.to, result)
        return result
      }

      if (def.type === 'set') {
        const to = def.to
        const value = resolveMaybePath(root, def.value, ctx)
        setByPath(root, to, value)
        return value
      }

      throw new Error(`unsupported action type: ${def.type}`)
    } catch (err) {
      if (onError) onError(err, { actionId, def, ctx })
      throw err
    }
  }

  async function runInline(def, ctx = {}) {
    // 支持 flow 的内联 step
    const inlineId = `__inline_${Math.random().toString(36).slice(2)}`
    actions[inlineId] = def
    try {
      return await runAction(inlineId, ctx)
    } finally {
      delete actions[inlineId]
    }
  }

  return {
    root,
    actions,
    runAction,
    getValue: (path) => getByPath(root, path),
    setValue: (path, value) => setByPath(root, path, value)
  }
}
