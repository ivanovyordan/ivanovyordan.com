import React from 'react';
import type { CourseModulesBlock as CourseModulesBlockType } from '../../types';
import Section from '../Section';

interface CourseModulesBlockProps {
  block: CourseModulesBlockType;
}

const CourseModulesBlock: React.FC<CourseModulesBlockProps> = ({ block }) => {
  const modules = block.modules || [];

  return (
    <Section>
      {block.title && (
        <div className="section-head">
          <h2>{block.title}</h2>
        </div>
      )}
      <div className="grid">
        {modules.map((module) => (
          <article className="card card--open span-6" key={module.title}>
            <h3>{module.title}</h3>
            <ul className="checks">
              {module.lessons.map((lesson) => (
                <li key={lesson}>{lesson}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
};

export default CourseModulesBlock;
