import {UploadOptions} from './internal/upload-options'
import {UploadResponse} from './internal/upload-response'
import {ReleaseAssetClient, DefaultReleaseAssetClient} from './internal/release-asset-client'

export {
  ReleaseAssetClient,
  UploadResponse,
  UploadOptions
}

/**
 * Constructs an ArtifactClient
 */
export function create(): ReleaseAssetClient {
  return DefaultReleaseAssetClient.create()
}