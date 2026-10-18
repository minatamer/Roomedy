import { readFile } from 'node:fs/promises';
// Review-only: there is intentionally no cloud child-process API in this file.
try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--config')
    throw new Error('release-rollout-options');
  const raw = await readFile(args[1]);
  if (raw.length > 16 * 1024) throw new Error('release-rollout-bound');
  const c = JSON.parse(raw.toString('utf8'));
  const required = [
    'project',
    'region',
    'registry',
    'frontendService',
    'backendService',
    'frontendIdentity',
    'backendIdentity',
    'publicOrigin',
    'backendOrigin',
    'providerSecretRef',
    'bridgeSecretRef',
    'model',
    'fundingApproval',
    'privacyApproval',
    'challengeApproval',
    'visualApproval',
    'securityApproval',
    'linuxProofDigest',
    'frontendImage',
    'backendImage',
    'rollbackFrontend',
    'rollbackBackend',
  ];
  if (
    required.some(
      (k) => typeof c[k] !== 'string' || !c[k] || /[\r\n]/.test(c[k]),
    ) ||
    !/^[a-f0-9]{64}$/.test(c.linuxProofDigest) ||
    ![c.frontendImage, c.backendImage].every((v) =>
      /@sha256:[a-f0-9]{64}$/.test(v),
    )
  )
    throw new Error('release-rollout-unconfigured');
  console.log(
    JSON.stringify({
      kind: 'review-only-rollout-plan',
      services: [c.backendService, c.frontendService],
      order: [
        'verify-current-linux-proof',
        'owner-external-authorization',
        'private-backend-paid-off',
        'audience-bound-frontend',
        'no-cost-probes',
        'separately-approved-live-cases',
        'explicit-domain-authorization',
      ],
      executeAvailable: false,
      mutations: 0,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      error:
        error instanceof Error && /^release-[a-z-]+$/.test(error.message)
          ? error.message
          : 'release-rollout-invalid',
      mutations: 0,
    }),
  );
  process.exitCode = 1;
}
