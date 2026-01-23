export function nodeLabel(n) {
  if (!n) return "null";
  const t = n.type || "Unknown";
  if (t === "Button") return `Button: ${n.text || ""}`;
  if (t === "Input") return `Input: ${n.bind || ""}`;
  if (t === "Select") return `Select: ${n.bind || ""}`;
  if (t === "Table") return `Table: ${n.bind || ""}`;
  if (t === "Dialog") return `Dialog: ${n.title || ""}`;
  if (t === "FormItem") return `FormItem: ${n.label || ""}`;
  return t;
}

// 给每个 schema node 确保有 _uid，作为 el-tree node-key
export function ensureUid(n) {
  if (!n) return;
  if (!n._uid) n._uid = "n_" + Date.now() + "_" + Math.random().toString(16).slice(2);
	// return n._uid;
}

function setDefineProperty(obj, prop, value, op = {}) {
  Object.defineProperty(obj, prop, {
    value,
    enumerable: false,  // 不参与遍历
    configurable: true,
    writable: true,
		...op,
  })
}

export function buildLayoutTree(layoutNode, parentTreeNode = null) {
  if (!layoutNode) return null;
  ensureUid(layoutNode);

  const treeNode = {
    id: layoutNode._uid,
    label: nodeLabel(layoutNode),
  };
	setDefineProperty(treeNode, 'ref', layoutNode);
	setDefineProperty(treeNode, 'parentNode', parentTreeNode);

	if (Array.isArray(layoutNode.children)) {
		treeNode.children = layoutNode.children.map(child => buildLayoutTree(child, treeNode));
	}

  return treeNode;
}
