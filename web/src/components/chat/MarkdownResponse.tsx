"use client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { ComponentPropsWithoutRef } from 'react';
import type { Components, ExtraProps } from 'react-markdown';
import 'highlight.js/styles/github-dark.css';

interface MarkdownResponseProps {
  content: string;
  className?: string;
}

const combineClassName = (base: string, extra?: string) =>
  extra ? `${base} ${extra}` : base;

type ExtendedCodeProps = ComponentPropsWithoutRef<'code'> & ExtraProps & { inline?: boolean };

const markdownComponents: Components = {
  h1: ({ className, children, ...props }) => (
    <h1
      {...props}
      className={combineClassName(
        'text-2xl font-bold text-foreground mb-4 mt-6 first:mt-0 border-b border-border pb-2',
        className
      )}
    >
      {children}
    </h1>
  ),
  h2: ({ className, children, ...props }) => (
    <h2
      {...props}
      className={combineClassName(
        'text-xl font-semibold text-foreground mb-3 mt-5 first:mt-0',
        className
      )}
    >
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }) => (
    <h3
      {...props}
      className={combineClassName(
        'text-lg font-medium text-foreground mb-2 mt-4 first:mt-0',
        className
      )}
    >
      {children}
    </h3>
  ),
  h4: ({ className, children, ...props }) => (
    <h4
      {...props}
      className={combineClassName(
        'text-base font-medium text-foreground mb-2 mt-3 first:mt-0',
        className
      )}
    >
      {children}
    </h4>
  ),
  p: ({ className, children, ...props }) => (
    <p
      {...props}
      className={combineClassName(
        'text-foreground leading-7 mb-4 last:mb-0',
        className
      )}
    >
      {children}
    </p>
  ),
  ul: ({ className, children, ...props }) => (
    <ul
      {...props}
      className={combineClassName('list-disc list-outside ml-6 mb-4 space-y-2', className)}
    >
      {children}
    </ul>
  ),
  ol: ({ className, children, ...props }) => (
    <ol
      {...props}
      className={combineClassName('list-decimal list-outside ml-6 mb-4 space-y-2', className)}
    >
      {children}
    </ol>
  ),
  li: ({ className, children, ...props }) => (
    <li
      {...props}
      className={combineClassName('text-foreground leading-6', className)}
    >
      {children}
    </li>
  ),
  blockquote: ({ className, children, ...props }) => (
    <blockquote
      {...props}
      className={combineClassName(
        'border-l-4 border-primary pl-4 py-2 my-4 bg-muted rounded-r-md italic text-muted-foreground',
        className
      )}
    >
      {children}
    </blockquote>
  ),
  code: ({ inline, className, children, ...props }: ExtendedCodeProps) => {
    if (inline) {
      return (
        <code
          {...props}
          className={combineClassName(
            'bg-muted text-foreground px-1.5 py-0.5 rounded-md text-sm font-mono border border-border',
            className
          )}
        >
          {children}
        </code>
      );
    }
    const combined = combineClassName(
      'block bg-muted text-foreground p-4 rounded-lg text-sm font-mono overflow-x-auto border border-border',
      className
    );
    return (
      <code {...props} className={combined}>
        {children}
      </code>
    );
  },
  pre: ({ className, children, ...props }) => (
    <pre
      {...props}
      className={combineClassName(
        'bg-muted rounded-lg p-4 mb-4 overflow-x-auto border border-border',
        className
      )}
    >
      {children}
    </pre>
  ),
  table: ({ className, children, ...props }) => (
    <div className="overflow-x-auto mb-4">
      <table
        {...props}
        className={combineClassName('min-w-full border border-border rounded-lg', className)}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ className, children, ...props }) => (
    <thead
      {...props}
      className={combineClassName('bg-muted', className)}
    >
      {children}
    </thead>
  ),
  th: ({ className, children, ...props }) => (
    <th
      {...props}
      className={combineClassName(
        'border border-border px-4 py-2 text-left font-semibold text-foreground',
        className
      )}
    >
      {children}
    </th>
  ),
  td: ({ className, children, ...props }) => (
    <td
      {...props}
      className={combineClassName(
        'border border-border px-4 py-2 text-foreground',
        className
      )}
    >
      {children}
    </td>
  ),
  a: ({ className, children, href, ...props }) => (
    <a
      {...props}
      href={typeof href === 'string' ? href : '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={combineClassName('text-primary hover:underline font-medium', className)}
    >
      {children}
    </a>
  ),
  strong: ({ className, children, ...props }) => (
    <strong
      {...props}
      className={combineClassName('font-semibold text-foreground', className)}
    >
      {children}
    </strong>
  ),
  em: ({ className, children, ...props }) => (
    <em
      {...props}
      className={combineClassName('italic text-foreground', className)}
    >
      {children}
    </em>
  ),
  hr: ({ className, ...props }) => (
    <hr
      {...props}
      className={combineClassName('border-0 border-t border-border my-6', className)}
    />
  ),
};

export default function MarkdownResponse({ content, className = "" }: MarkdownResponseProps) {
  return (
    <div className={`markdown-response ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}