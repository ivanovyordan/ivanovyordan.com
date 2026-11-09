import React from 'react';
import type { StatementBlock as StatementBlockType } from '../../types';

interface StatementBlockProps {
  block: StatementBlockType;
}

/** The dealt type moment (word-highlight): one statement that turns to ink word by word on scroll. */
const StatementBlock: React.FC<StatementBlockProps> = ({ block }) => {
  const { text, highlight } = block;
  const at = highlight ? text.indexOf(highlight) : -1;

  return (
    <section
      className="section statement"
      id="approach"
      data-moment="word-highlight"
      aria-label={block.label || 'What I do'}
    >
      <div className="wrap">
        {block.label && <p className="t-label">{block.label}</p>}
        <p className="mo-wh__text">
          {at < 0 ? (
            text
          ) : (
            <>
              {text.slice(0, at)}
              <strong>{highlight}</strong>
              {text.slice(at + (highlight as string).length)}
            </>
          )}
        </p>
      </div>
    </section>
  );
};

export default StatementBlock;
