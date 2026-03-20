import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import './HeatMap.css';

function buildWeeks(data) {
  if (!data || !data.length) return { weeks: [], max: 0, dateMap: new Map() };
  
  const byDate = new Map(data.map((d) => [d.date, { count: d.count, messages: d.messages || [] }]));
  const max = Math.max(1, ...data.map((d) => d.count));
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 52 * 7);
  const weeks = [];
  const dateMap = new Map(); // Map to store date for each cell position
  
  for (let i = 0; i < 52; i++) {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const days = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + d);
      const key = day.toISOString().slice(0, 10);
      const dayData = byDate.get(key) || { count: 0, messages: [] };
      days.push(dayData.count);
      dateMap.set(`${i}-${d}`, { date: key, count: dayData.count, messages: dayData.messages });
    }
    weeks.push(days);
  }
  
  return { weeks, max, dateMap };
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HeatMap({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, date: '', count: 0, messages: [] });
  const { weeks, max, dateMap } = buildWeeks(data || []);

  useEffect(() => {
    if (!svgRef.current || !weeks.length) return;
    const cellSize = 12;
    const gap = 3;
    const width = 52 * (cellSize + gap) - gap;
    const height = 7 * (cellSize + gap) - gap;

    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current).attr('viewBox', `0 0 ${width} ${height}`);

    const colorScale = d3.scaleLinear().domain([0, max]).range(['#1c2128', '#58a6ff']).clamp(true);

    weeks.forEach((days, wi) => {
      days.forEach((count, di) => {
        const x = wi * (cellSize + gap);
        const y = di * (cellSize + gap);
        const cellData = dateMap.get(`${wi}-${di}`);
        
        svg
          .append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', cellSize)
          .attr('height', cellSize)
          .attr('rx', 2)
          .attr('fill', max > 0 ? colorScale(count) : 'var(--bg-card)')
          .attr('class', 'heatmap__cell')
          .on('mouseenter', function(event) {
            if (cellData && cellData.count > 0) { // Only show tooltip for cells with commits
              setTooltip({
                show: true,
                x: event.clientX,
                y: event.clientY - 10,
                date: cellData.date,
                count: cellData.count,
                messages: cellData.messages || []
              });
            }
          })
          .on('mousemove', function(event) {
            if (tooltip.show) {
              setTooltip(prev => ({
                ...prev,
                x: event.clientX,
                y: event.clientY - 10
              }));
            }
          })
          .on('mouseleave', function() {
            setTooltip({ show: false, x: 0, y: 0, date: '', count: 0, messages: [] });
          });
      });
    });
  }, [weeks, max, dateMap, tooltip.show]);

  const handleContainerMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, date: '', count: 0, messages: [] });
  };

  if (!data || !data.length) {
    return (
      <div className="heatmap heatmap--empty">
        <p className="heatmap__empty">No commit data available.</p>
      </div>
    );
  }

  return (
    <div className="heatmap" ref={containerRef} onMouseLeave={handleContainerMouseLeave}>
      <h3 className="heatmap__title">Commit activity (last 52 weeks)</h3>
      <svg ref={svgRef} className="heatmap__svg" />
      {tooltip.show && (
        <div
          ref={tooltipRef}
          className="heatmap__tooltip"
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <div className="heatmap__tooltip-date">{formatDate(tooltip.date)}</div>
          <div className="heatmap__tooltip-count">
            {tooltip.count} {tooltip.count === 1 ? 'commit' : 'commits'}
          </div>
          {tooltip.messages && tooltip.messages.length > 0 && (
            <div className="heatmap__tooltip-messages">
              {tooltip.messages.map((msg, i) => (
                <div key={i} className="heatmap__tooltip-message">
                  • {msg}
                </div>
              ))}
              {tooltip.count > tooltip.messages.length && (
                <div className="heatmap__tooltip-more">
                  +{tooltip.count - tooltip.messages.length} more
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
