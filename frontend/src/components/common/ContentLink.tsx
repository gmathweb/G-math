import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ContentLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

/** Admin-edited links: in-app paths use the router, anything else is a plain anchor. */
export function ContentLink({ href, className, children }: ContentLinkProps) {
  if (href.startsWith('/') && !href.startsWith('//')) {
    return <Link to={href} className={className}>{children}</Link>;
  }
  return <a href={href} className={className}>{children}</a>;
}
