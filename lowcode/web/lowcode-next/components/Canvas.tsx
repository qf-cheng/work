import { NodeRenderer } from "./NodeRenderer";
import type { LayoutNode, RuntimeRoot } from "../lib/schema";

interface CanvasProps {
  layout: LayoutNode;
  runtime: RuntimeRoot;
  onAction: (actionId: string, ctx?: Record<string, unknown>) => void;
}

export function Canvas({ layout, runtime, onAction }: CanvasProps) {
  return (
    <section className="canvas">
      <NodeRenderer node={layout} runtime={runtime} onAction={onAction} />
    </section>
  );
}
