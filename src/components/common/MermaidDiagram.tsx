'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        primaryColor: '#eff6ff', // pastel blue
        primaryTextColor: '#1e3a8a',
        primaryBorderColor: '#3b82f6',
        lineColor: '#64748b',
        secondaryColor: '#f0fdf4', // pastel green
        tertiaryColor: '#fefce8', // pastel yellow
      },
      securityLevel: 'loose',
    });

    if (ref.current) {
      ref.current.innerHTML = ''; // clear before re-render
      mermaid.contentLoaded();
      const renderChart = async () => {
        const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substring(7)}`, chart);
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      };
      renderChart();
    }
  }, [chart]);

  return <div ref={ref} className="flex justify-center w-full" />;
}
