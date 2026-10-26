export type ProjectDestination = 'design' | 'cost';
export function projectDestination(search: string): ProjectDestination {
  return new URLSearchParams(search).get('phase') === 'cost'
    ? 'cost'
    : 'design';
}
export function destinationHref(href: string, destination: ProjectDestination) {
  const url = new URL(href, 'https://roomedy.invalid');
  if (destination === 'cost') url.searchParams.set('phase', 'cost');
  else url.searchParams.delete('phase');
  return `${url.pathname}${url.search}${url.hash}`;
}
