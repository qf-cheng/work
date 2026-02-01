import { NodeRenderer } from "./NodeRenderer";
import type { LowCodeSchema } from "../lib/schema";

interface CanvasProps {
  schema: LowCodeSchema;
  selectedId: string;
}

export function Canvas({ schema, selectedId }: CanvasProps) {
  return (
    <section className="canvas">
      <NodeRenderer
        nodeId={schema.rootId}
        nodes={schema.nodes}
        selectedId={selectedId}
      />
    </section>
  );
}
