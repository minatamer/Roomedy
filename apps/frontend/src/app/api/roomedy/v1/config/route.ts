import { forwardGet } from '../../../../../server/bridge';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  return forwardGet('config', request);
}
