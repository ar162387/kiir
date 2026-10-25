'use client';

import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
import TopLoadingLine from './TopLoadingLine';

/** Bound to real router transitions; no artificial delay or simulated percentage. */
export default function NavigationFeedback({pending}:{pending:boolean}) {
  const pathname=usePathname();
  const isUr=pathname==='/ur'||pathname.startsWith('/ur/');
  if(!pending)return null;
  return createPortal(<TopLoadingLine isUr={isUr}/>,document.body);
}
