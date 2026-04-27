import { useEffect, useRef } from 'react';
import { CATEGORY_COLOR } from '../utils/ai.js';

const LEGEND = [
  { key: 'model',    label: 'Modèles LLM' },
  { key: 'research', label: 'Recherche' },
  { key: 'business', label: 'Business' },
  { key: 'tools',    label: 'Outils / Dev' },
  { key: 'data',     label: 'Data' },
  { key: 'other',    label: 'Autre' },
];

export default function BubbleChart({ stories, loading, activeCategory, onCategoryChange, onStoryClick }) {
  const svgRef       = useRef(null);
  const simRef       = useRef(null);
  const floatTimer   = useRef(null);

  /* Rebuild simulation when stories change */
  useEffect(() => {
    const d3 = window.d3;
    if (!d3 || !stories.length || !svgRef.current) return;

    /* Cancel any running float animation */
    if (floatTimer.current) { floatTimer.current.stop(); floatTimer.current = null; }

    const wrap = svgRef.current.parentElement;
    const W    = wrap.clientWidth  || 600;
    const H    = wrap.clientHeight || 500;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('width', W).attr('height', H);
    svg.selectAll('*').remove();

    const pool     = stories.slice(0, 50);
    const maxScore = d3.max(pool, d => d.score) || 1;
    const rScale   = d3.scaleSqrt().domain([0, maxScore]).range([14, 62]);

    const nodes = pool.map(s => ({
      ...s,
      r:           rScale(s.score),
      x:           W / 2 + (Math.random() - .5) * 200,
      y:           H / 2 + (Math.random() - .5) * 200,
      _floatSpeed: 0.28 + Math.random() * 0.35,
      _floatPhase: Math.random() * Math.PI * 2,
    }));

    if (simRef.current) simRef.current.stop();

    const sim = d3.forceSimulation(nodes)
      .force('center',    d3.forceCenter(W / 2, H / 2).strength(.05))
      .force('charge',    d3.forceManyBody().strength(-18))
      .force('collision', d3.forceCollide().radius(d => d.r + 3).strength(.9))
      .force('x',         d3.forceX(W / 2).strength(.025))
      .force('y',         d3.forceY(H / 2).strength(.025))
      .alphaDecay(.014);

    simRef.current = sim;
    const g = svg.append('g');

    const circles = g.selectAll('circle')
      .data(nodes).enter().append('circle')
      .attr('r', 0)
      .attr('fill',         d => d.color)
      .attr('fill-opacity', .82)
      .attr('stroke',       'rgba(255,255,255,.3)')
      .attr('stroke-width', 1.8)
      .style('cursor', 'pointer')
      .on('mouseover', (evt, d) => {
        d3.select(evt.target).transition().duration(150)
          .attr('fill-opacity', 1)
          .attr('stroke', 'rgba(255,255,255,.7)')
          .attr('stroke-width', 2.5)
          .attr('r', d.r * 1.12);
      })
      .on('mouseout', (evt, d) => {
        d3.select(evt.target).transition().duration(200)
          .attr('fill-opacity', .82)
          .attr('stroke', 'rgba(255,255,255,.3)')
          .attr('stroke-width', 1.8)
          .attr('r', d.r);
      })
      .on('click', (evt, d) => {
        evt.stopPropagation();
        d3.select(evt.target).transition().duration(120)
          .attr('r', d.r * 1.25).attr('fill-opacity', .6)
          .transition().duration(180)
          .attr('r', d.r).attr('fill-opacity', .82);
        if (onStoryClick) onStoryClick(d);
      });

    circles.transition()
      .delay((_, i) => i * 20)
      .duration(700)
      .ease(d3.easeBounceOut)
      .attr('r', d => d.r);

    const labels = g.selectAll('text')
      .data(nodes.filter(d => d.r > 28)).enter().append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', 'white').attr('font-size', d => Math.max(8, Math.min(11, d.r / 4.2)))
      .attr('font-weight', '700').attr('letter-spacing', '-.01em')
      .attr('pointer-events', 'none').style('opacity', 0)
      .text(d => {
        const words = d.title.split(' ');
        return words.slice(0, 3).join(' ') + (words.length > 3 ? '…' : '');
      });

    sim.on('tick', () => {
      circles
        .attr('cx', d => (d.x = Math.max(d.r + 2, Math.min(W - d.r - 2, d.x))))
        .attr('cy', d => (d.y = Math.max(d.r + 2, Math.min(H - d.r - 2, d.y))));
      labels.attr('x', d => d.x).attr('y', d => d.y);
    });

    /* After simulation settles, start gentle float animation */
    sim.on('end', () => {
      /* Freeze positions */
      nodes.forEach(d => { d._baseX = d.x; d._baseY = d.y; });

      const startMs = Date.now();
      floatTimer.current = d3.timer(() => {
        const t = (Date.now() - startMs) / 1000;
        circles.each(function(d) {
          const amp  = d.r * 0.13;
          const offY = Math.sin(t * d._floatSpeed + d._floatPhase) * amp;
          const offX = Math.cos(t * d._floatSpeed * 0.7 + d._floatPhase) * amp * 0.4;
          d3.select(this)
            .attr('cx', d._baseX + offX)
            .attr('cy', d._baseY + offY);
        });
        labels.each(function(d) {
          const amp  = d.r * 0.13;
          const offY = Math.sin(t * d._floatSpeed + d._floatPhase) * amp;
          const offX = Math.cos(t * d._floatSpeed * 0.7 + d._floatPhase) * amp * 0.4;
          d3.select(this)
            .attr('x', d._baseX + offX)
            .attr('y', d._baseY + offY);
        });
      });
    });

    setTimeout(() => labels.transition().duration(500).style('opacity', 1), 900);

    return () => {
      sim.stop();
      if (floatTimer.current) { floatTimer.current.stop(); floatTimer.current = null; }
    };
  }, [stories]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Update opacity on category filter change — no simulation restart */
  useEffect(() => {
    const d3 = window.d3;
    if (!d3 || !svgRef.current) return;
    d3.select(svgRef.current).selectAll('circle')
      .transition().duration(280)
      .attr('fill-opacity', d => !activeCategory || d.category === activeCategory ? .88 : .08)
      .attr('stroke-opacity', d => !activeCategory || d.category === activeCategory ? 1 : .15);
  }, [activeCategory]);

  if (loading) {
    return (
      <div className="bubble-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[88, 54, 70, 46, 62, 38, 52, 80].map((s, i) => (
            <div key={i} className="sk sk-circle" style={{ width: s, height: s }} />
          ))}
        </div>
        <div className="sk sk-line" style={{ width: 140 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="bubble-wrap">
        <svg ref={svgRef} />
      </div>
      <div className="bubble-legend">
        {LEGEND.map(({ key, label }) => (
          <div
            key={key}
            className={`legend-item${activeCategory === key ? ' active' : ''}`}
            style={activeCategory === key ? { borderColor: CATEGORY_COLOR[key], color: CATEGORY_COLOR[key] } : {}}
            onClick={() => onCategoryChange(key)}
          >
            <div className="legend-dot" style={{ background: CATEGORY_COLOR[key] }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
