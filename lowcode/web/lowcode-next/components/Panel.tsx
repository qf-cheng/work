import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function Panel({ title, description, children }: PanelProps) {
  return (
    <section className="panel">
      <header>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
