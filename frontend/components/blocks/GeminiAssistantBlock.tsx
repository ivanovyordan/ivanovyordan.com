import React from 'react';
import { config } from '../../config';
import { getSiteConfig } from '../../utils/site';
import type { GeminiAssistantBlock as GeminiAssistantBlockType } from '../../types';
import Section from '../Section';

interface GeminiAssistantBlockProps {
  block: GeminiAssistantBlockType;
}

/**
 * The digital twin's markup. It is all static: twin.ts (loaded by client.ts when
 * the section nears the screen) wires the form, the question counter and the
 * answer. The submit button stays disabled until then, so an early Enter cannot
 * submit the form natively.
 */
const GeminiAssistantBlock: React.FC<GeminiAssistantBlockProps> = () => {
  const { maxQuestions } = config.assistant;
  const siteConfig = getSiteConfig();

  return (
    <Section id="twin" labelledBy="twin-h">
      <div className="section-head">
        <h2 id="twin-h">Ask my digital twin</h2>
        <p>
          It answers the way I would.{' '}
          <span data-twin-credits>
            {maxQuestions} free {maxQuestions === 1 ? 'question' : 'questions'} left
          </span>
          .
        </p>
      </div>

      <form className="form twin-form" data-twin-form>
        {/* Honeypot field - hidden from users, catches bots */}
        <input
          type="text"
          name="website"
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
          className="twin-form__trap"
        />
        <div className="field">
          <label htmlFor="twin-question">Your question</label>
          <input
            id="twin-question"
            name="query"
            type="text"
            placeholder="For example, how do I log and share my wins?"
          />
        </div>
        <button className="btn btn--primary" type="submit" disabled>
          Ask my digital twin
        </button>
      </form>

      <div className="stack-4" data-twin-limit hidden>
        <p className="t-lead">That's your {maxQuestions} questions.</p>
        <p>
          Full access comes with the annual{' '}
          {siteConfig.newsletter ? (
            <a className="link" href={siteConfig.newsletter.url} target="_blank" rel="noopener noreferrer">
              {siteConfig.newsletter.name}
            </a>
          ) : (
            'Data Gibberish'
          )}{' '}
          subscription. If you'd rather work on your case with me, book a discovery call.
        </p>
        <a
          className="btn btn--primary"
          href={siteConfig.discoveryCallPage || siteConfig.discoveryCallUrl || siteConfig.bookingUrl || '#'}
          data-track="booking"
          data-track-loc="ai_assistant_limit"
        >
          Book a discovery call
        </a>
      </div>

      <div role="status" aria-live="polite" className="twin-answer" data-twin-answer />
    </Section>
  );
};

export default GeminiAssistantBlock;
