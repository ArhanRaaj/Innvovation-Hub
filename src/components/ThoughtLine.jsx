'use client';

import { useEffect, useState } from 'react';
import { SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import './ThoughtLine.css';

export default function ThoughtLine({
  working = true,
  steps = ['Reading the question', 'Searching components', 'Synthesizing architecture'],
  label = 'Thinking…',
  doneLabel = 'Thought for',
  fontSize = 15,
  collapsible = true,
  showTimer = true,
  onSettle = () => {}
}) {
  const [seconds, setSeconds] = useState(0);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!working) {
      onSettle?.(seconds);
      return;
    }
    const interval = setInterval(() => {
      setSeconds(s => +(s + 0.1).toFixed(1));
    }, 100);
    return () => clearInterval(interval);
  }, [working, seconds, onSettle]);

  return (
    <div className="thought-line" style={{ '--tl-size': `${fontSize}px` }}>
      <button
        type="button"
        className="thought-line__header"
        onClick={() => collapsible && setExpanded(v => !v)}
      >
        <span className="thought-line__glyph">
          <HugeiconsIcon icon={SparklesIcon} size={fontSize} strokeWidth={2} />
        </span>
        <span className="thought-line__label">
          {working ? label : `${doneLabel} ${seconds}s`}
        </span>
        {showTimer && working && (
          <span className="thought-line__timer">{seconds.toFixed(1)}s</span>
        )}
      </button>

      {expanded && steps && steps.length > 0 && (
        <ul className="thought-line__steps">
          {steps.map((step, idx) => (
            <li
              key={idx}
              className="thought-line__step"
              data-active={idx === steps.length - 1 && working ? '' : undefined}
            >
              <span>&bull;</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
