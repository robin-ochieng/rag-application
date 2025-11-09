"use client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import 'highlight.js/styles/github-dark.css';

interface MarkdownResponseProps {
  content: string;
  className?: string;
}

type ChildrenProps = { children: ReactNode };
type CodeComponentProps = ComponentPropsWithoutRef<'code'> & { inline?: boolean };
type AnchorComponentProps = ComponentPropsWithoutRef<'a'>;

export default function MarkdownResponse({ content, className = "" }: MarkdownResponseProps) {
  return (
    <div className={`markdown-response ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }: ChildrenProps) => (
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-4 mt-6 first:mt-0 border-b border-[rgb(var(--border))] pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }: ChildrenProps) => (
            <h2 className="text-xl font-semibold text-[rgb(var(--foreground))] mb-3 mt-5 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }: ChildrenProps) => (
            <h3 className="text-lg font-medium text-[rgb(var(--foreground))] mb-2 mt-4 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }: ChildrenProps) => (
            <h4 className="text-base font-medium text-[rgb(var(--foreground))] mb-2 mt-3 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }: ChildrenProps) => (
            <p className="text-[rgb(var(--foreground))] leading-7 mb-4 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }: ChildrenProps) => (
            <ul className="list-disc list-outside ml-6 mb-4 space-y-2">
              {children}
            </ul>
          ),
          ol: ({ children }: ChildrenProps) => (
            <ol className="list-decimal list-outside ml-6 mb-4 space-y-2">
              {children}
            </ol>
          ),
          li: ({ children }: ChildrenProps) => (
            <li className="text-[rgb(var(--foreground))] leading-6">
              {children}
            </li>
          ),
          blockquote: ({ children }: ChildrenProps) => (
            <blockquote className="border-l-4 border-[rgb(var(--primary))] pl-4 py-2 my-4 bg-[rgb(var(--muted))] rounded-r-md italic text-[rgb(var(--muted-foreground))]">
              {children}
            </blockquote>
          ),
          code: ({ inline, className: codeClassName, children, ...rest }: CodeComponentProps) => {
            if (inline) {
              return (
                <code
                  className="bg-[rgb(var(--muted))] text-[rgb(var(--foreground))] px-1.5 py-0.5 rounded-md text-sm font-mono border border-[rgb(var(--border))]"
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            const combined = `block bg-[rgb(var(--muted))] text-[rgb(var(--foreground))] p-4 rounded-lg text-sm font-mono overflow-x-auto border border-[rgb(var(--border))] ${codeClassName ?? ''}`;
            return (
              <code className={combined} {...rest}>
                {children}
              </code>
            );
          },
          pre: ({ children }: ChildrenProps) => (
            <pre className="bg-[rgb(var(--muted))] rounded-lg p-4 mb-4 overflow-x-auto border border-[rgb(var(--border))]">
              {children}
            </pre>
          ),
          table: ({ children }: ChildrenProps) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-[rgb(var(--border))] rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }: ChildrenProps) => (
            <thead className="bg-[rgb(var(--muted))]">
              {children}
            </thead>
          ),
          th: ({ children }: ChildrenProps) => (
            <th className="border border-[rgb(var(--border))] px-4 py-2 text-left font-semibold text-[rgb(var(--foreground))]">
              {children}
            </th>
          ),
          td: ({ children }: ChildrenProps) => (
            <td className="border border-[rgb(var(--border))] px-4 py-2 text-[rgb(var(--foreground))]">
              {children}
            </td>
          ),
          a: ({ href, children, ...rest }: AnchorComponentProps) => (
            <a 
              href={typeof href === 'string' ? href : '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[rgb(var(--primary))] hover:underline font-medium"
              {...rest}
            >
              {children}
            </a>
          ),
          strong: ({ children }: ChildrenProps) => (
            <strong className="font-semibold text-[rgb(var(--foreground))]">
              {children}
            </strong>
          ),
          em: ({ children }: ChildrenProps) => (
            <em className="italic text-[rgb(var(--foreground))]">
              {children}
            </em>
          ),
          hr: () => (
            <hr className="border-0 border-t border-[rgb(var(--border))] my-6" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}