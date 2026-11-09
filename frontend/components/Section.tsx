import React, { createContext, useContext } from 'react';

/** True on pages whose sections run as long as their content (inner pages, posts). */
export const FlowContext = createContext(false);
/** True inside a column or sidebar: the block renders its content without a section of its own. */
export const BareContext = createContext(false);

interface SectionProps {
  id?: string;
  /** Screens the section holds at 1440x900: 1 or 2 (layout-v4.md). */
  h?: 1 | 2;
  /** Screens on a phone, when stacking makes the content taller than one. */
  hm?: 1 | 2;
  /** Inner pages and long text run as long as their content instead of whole screens. */
  flow?: boolean;
  labelledBy?: string;
  /** A dealt moment this section carries (data-moment). */
  moment?: string;
  className?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ id, h = 1, hm, flow: flowProp, labelledBy, moment, className = '', children }) => {
  const bare = useContext(BareContext);
  const inFlow = useContext(FlowContext);
  const flow = flowProp ?? inFlow;
  if (bare) return <>{children}</>;
  return (
  <section
    id={id}
    aria-labelledby={labelledBy}
    data-moment={moment}
    className={`section${flow ? ' section--flow' : ''}${className ? ` ${className}` : ''}`}
    style={flow ? undefined : ({ '--h': h, ...(hm ? { '--hm': hm } : {}) } as React.CSSProperties)}
  >
    <div className="wrap">{children}</div>
  </section>
  );
};

export default Section;
