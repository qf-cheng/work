import type { LayoutNode } from "./schema";

export function findNode(root: LayoutNode, id: string): LayoutNode | undefined {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return undefined;
}

export function updateNode(root: LayoutNode, id: string, patch: Partial<LayoutNode>): LayoutNode {
  if (root.id === id) {
    return { ...root, ...patch };
  }
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map((child) => updateNode(child, id, patch)),
  };
}

export function removeNode(root: LayoutNode, id: string): LayoutNode {
  if (!root.children) return root;
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== id)
      .map((child) => removeNode(child, id)),
  };
}

export function addChild(root: LayoutNode, targetId: string, child: LayoutNode): LayoutNode {
  if (root.id === targetId) {
    const children = root.children ? [...root.children, child] : [child];
    return { ...root, children };
  }
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map((item) => addChild(item, targetId, child)),
  };
}
