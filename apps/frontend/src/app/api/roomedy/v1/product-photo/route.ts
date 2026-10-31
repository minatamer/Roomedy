import { forwardProductPhoto } from '../../../../../server/bridge';
export const dynamic = 'force-dynamic';
export function POST(request: Request) {
  return forwardProductPhoto(request);
}
