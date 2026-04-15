import { redis } from '../../config/redis'

export const collaborationChannels = {
  updates: (documentId: string) => `doc:${documentId}:updates`,
  awareness: (documentId: string) => `doc:${documentId}:awareness`,
  system: (documentId: string) => `doc:${documentId}:system`,
}

export async function publishDocumentAccessRevoked(documentId: string, userId: string) {
  await redis.publish(
    collaborationChannels.system(documentId),
    JSON.stringify({ event: 'document:access_revoked', userId }),
  )
}
