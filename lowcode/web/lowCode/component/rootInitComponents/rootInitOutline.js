import { number, string } from 'zod'

export function uid() {
  return 'k_' + Date.now() + '_' + Math.random().toString(16).slice(2)
}

export function typeOfVal(v) {
  const t = typeof v
  switch (t) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
      return t
    case 'object':
      if (Array.isArray(v)) return 'array'
      if (Object.prototype.isPrototypeOf.call(Function, v)) return 'function'
      return t
    default:
      return 'string'
  }
}

export function summary(v) {
  const t = typeOfVal(v)
  if (t === 'object') return '{...}'
  if (t === 'array') return `[${v.length}]`
  if (t === 'string') return `"${v}"`
  if (t === 'function') return 'Function()'
  return String(v)
}

function setDefineProperty(obj, prop, value, op = {}) {
  Object.defineProperty(obj, prop, {
    value,
    enumerable: false, // 不参与遍历
    configurable: true,
    writable: true,
    ...op
  })
}

export function newNoTypeNode(k, v, parentNode) {
  const node = {
    id: uid(),
    label: `${k} : ${summary(v)}`,
    key: k,
    isRootScope: false
  }
  setDefineProperty(node, 'parentNode', parentNode)
  setDefineProperty(node, 'valueRef', v)
  node.children = buildChildren(v, node)
  return node
}

export function buildChildren(obj, parentNode = null) {
  const t = typeOfVal(obj)
  if (t === 'object') {
    return Object.keys(obj).map((k) => {
      const v = obj[k]
      const node = newNoTypeNode(k, v, parentNode)
      return node
    })
  }
  if (t === 'array') {
    return obj.map((v, idx) => {
      const k = `[${idx}]`
      const node = newNoTypeNode(k, v, parentNode)
      node.isArrayIndex = true
      node.arrayIndex = idx 
      return node
    })
  }
  return []
}
