import { forwardPost } from '../../../../../server/bridge';
export const dynamic = 'force-dynamic';
export function POST(request: Request) {
  return forwardPost('sourcing', request);
}
