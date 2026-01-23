const REQUIRED_BINDINGS = {
  Input: ['bind'],
  Select: ['bind'],
  Table: ['bind'],
  Pagination: ['bindPagination', 'bind'],
  Dialog: ['bindVisible']
}

const OPTIONAL_BIND_FIELDS = ['bind', 'bindVisible', 'bindPagination', 'model']

const ALLOWED_SCOPES = ['data', 'ui', 'tmp', 'ctx']

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isPathSegment(seg) {
  if (!seg) return false
  if (/^\d+$/.test(seg)) return true
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(seg)
}

function isValidPath(path) {
  if (typeof path !== 'string') return false
  const p = path.trim()
  if (!p) return false
  if (p.includes('[') || p.includes(']') || p.includes(' ')) return false
  const parts = p.split('.').filter(Boolean)
  if (!parts.length) return false
  if (p.startsWith('$')) {
    const scope = parts[0].slice(1)
    if (!ALLOWED_SCOPES.includes(scope)) return false
    if (parts.length < 2) return false
    return parts.slice(1).every(isPathSegment)
  }
  return parts.every(isPathSegment)
}

function parsePath(path) {
  if (typeof path !== 'string') return null
  const p = path.trim()
  if (!p) return null
  const parts = p.split('.').filter(Boolean)
  if (!parts.length) return null
  if (p.startsWith('$')) {
    const scope = parts[0].slice(1)
    if (!ALLOWED_SCOPES.includes(scope)) return null
    return { scope: `$${scope}`, segments: parts.slice(1) }
  }
  return { scope: '$data', segments: parts }
}

function pathExists(root, segments) {
  let cur = root
  for (const seg of segments) {
    if (cur == null) return false
    if (!Object.prototype.hasOwnProperty.call(cur, seg)) return false
    cur = cur[seg]
  }
  return true
}

function getBindingFieldValue(node, field) {
  const directRaw = node?.[field]
  const propRaw = node?.props?.[field]
  const direct = isNonEmptyString(directRaw) ? directRaw.trim() : ''
  const prop = isNonEmptyString(propRaw) ? propRaw.trim() : ''
  return { direct, prop, value: direct || prop, directRaw, propRaw }
}

function hasBindingValue(node, field) {
  const directRaw = node?.[field]
  const propRaw = node?.props?.[field]
  if (isNonEmptyString(directRaw) || isNonEmptyString(propRaw)) return true
  if (directRaw !== undefined && directRaw !== null && typeof directRaw !== 'string') return true
  if (propRaw !== undefined && propRaw !== null && typeof propRaw !== 'string') return true
  return false
}

function formatNodeLabel(node) {
  const type = node?.type || 'Node'
  const uid = node?._uid ? `(${node._uid})` : ''
  return `${type}${uid}`
}

export function validateSchema(schema) {
  const errors = []
  const warnings = []

  if (!schema || typeof schema !== 'object') return { errors, warnings }

  const rootInit = schema.rootInit || {}

  function addIssue(list, node, message) {
    list.push({ message, nodeType: node?.type, nodeId: node?._uid || '' })
  }

  function checkRootInit(path, node, field) {
    const parsed = parsePath(path)
    if (!parsed) return
    if (parsed.scope === '$ctx') return
    const scopeObj = rootInit[parsed.scope]
    if (!scopeObj || typeof scopeObj !== 'object') {
      addIssue(
        warnings,
        node,
        `Missing rootInit for ${parsed.scope} used by ${formatNodeLabel(node)} (${field})`
      )
      return
    }
    if (!pathExists(scopeObj, parsed.segments)) {
      addIssue(
        warnings,
        node,
        `Missing rootInit path ${parsed.scope}.${parsed.segments.join('.')} for ${formatNodeLabel(
          node
        )} (${field})`
      )
    }
  }

  function validateBindingField(node, field, required = false) {
    const label = formatNodeLabel(node)
    const { direct, prop, value, directRaw, propRaw } = getBindingFieldValue(node, field)

    if (direct && prop && direct !== prop) {
      addIssue(warnings, node, `Conflicting ${field} on ${label} (node vs props)`)
    }

    if (directRaw !== undefined && directRaw !== null && typeof directRaw !== 'string') {
      addIssue(errors, node, `Invalid ${field} type on ${label} (node)`)
      return
    }
    if (propRaw !== undefined && propRaw !== null && typeof propRaw !== 'string') {
      addIssue(errors, node, `Invalid ${field} type on ${label} (props)`)
      return
    }

    if (!value) {
      if (required) {
        addIssue(errors, node, `Missing ${field} for ${label}`)
      }
      return
    }

    if (typeof value !== 'string') {
      addIssue(errors, node, `Invalid ${field} type for ${label} (expected string)`)
      return
    }

    if (!isValidPath(value)) {
      addIssue(errors, node, `Invalid ${field} path "${value}" for ${label}`)
      return
    }

    checkRootInit(value, node, field)
  }

  function validateNode(node) {
    if (!node || typeof node !== 'object') return

    const type = node.type
    const required = REQUIRED_BINDINGS[type]
    if (required) {
      const hasValue = required.some((field) => hasBindingValue(node, field))

      if (!hasValue) {
        addIssue(
          errors,
          node,
          `Missing ${required.join('/')} for ${formatNodeLabel(node)}`
        )
      }
    }

    const fieldsToValidate = new Set(OPTIONAL_BIND_FIELDS)
    if (required) required.forEach((field) => fieldsToValidate.add(field))
    fieldsToValidate.forEach((field) => validateBindingField(node, field, false))

    if (type === 'Select') {
      const options = node.options || node.props?.options
      if (options !== undefined && !Array.isArray(options)) {
        addIssue(warnings, node, `Select options should be an array for ${formatNodeLabel(node)}`)
      }
    }

    if (type === 'Table') {
      const columns = node.columns || node.props?.columns
      if (columns !== undefined && !Array.isArray(columns)) {
        addIssue(warnings, node, `Table columns should be an array for ${formatNodeLabel(node)}`)
      }
    }
  }

  function walk(node) {
    if (!node || typeof node !== 'object') return
    validateNode(node)
    const children = Array.isArray(node.children) ? node.children : []
    children.forEach((child) => walk(child))
  }

  walk(schema.layout)

  return { errors, warnings }
}
