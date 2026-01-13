import React from 'react';
import type { CourseModulesBlock as CourseModulesBlockType } from '../../types';

interface CourseModulesBlockProps {
  block: CourseModulesBlockType;
}

const CourseModulesBlock: React.FC<CourseModulesBlockProps> = ({ block }) => {
  const modules = block.modules || [];

  return (
    <section className="mb-24">
      {block.title && (
        <h2 className="text-3xl font-serif font-bold mb-12 text-center dark:text-white">
          {block.title}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {modules.map((module, idx) => (
          <div
            key={idx}
            className="p-8 border border-gray-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-colors bg-white dark:bg-zinc-900/20"
          >
            <h3 className="text-xl font-bold mb-6 pb-2 border-b border-gray-100 dark:border-zinc-800 dark:text-white">
              {module.title}
            </h3>
            <ul className="space-y-3">
              {module.lessons.map((lesson, lIdx) => (
                <li key={lIdx} className="flex items-center gap-3 text-gray-700 dark:text-zinc-300">
                  <span className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full"></span>
                  {lesson}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CourseModulesBlock;
