import * as core from '@actions/core'
import {
  UploadSpecification,
  getUploadSpecification
} from './upload-specification'
import {UploadHttpClient} from './upload-http-client'
import {UploadResponse} from './upload-response'
import {UploadOptions} from './upload-options'
import {
  checkReleaseAssetName
} from './utils'

export interface ReleaseAssetClient {
  /**
   * Uploads an release-asset
   *
   * @param uploadUrl url where the asset should be uploaded, required
   * @param assetName the name of the asset, required
   * @param assetContentType the content-type of the asset, required
   * @param files a list of absolute or relative paths that denote what files should be uploaded
   * @param rootDirectory an absolute or relative file path that denotes the root parent directory of the files being uploaded
   * @param options extra options for customizing the upload behavior
   * @returns single UploadInfo object
   */
  uploadReleaseAsset(
    uploadUrl: string,
    assetName: string,
    assetContentType: string,
    files: string[],
    rootDirectory: string,
    options?: UploadOptions
  ): Promise<UploadResponse>
}


export class DefaultReleaseAssetClient implements ReleaseAssetClient {
    /**
     * Constructor
     */
    static create(): DefaultReleaseAssetClient {
      return new DefaultReleaseAssetClient()
    }
  
    /**
     * Uploads an release-asset
     */
    async uploadReleaseAsset(
        uploadUrl: string,
        assetName: string,
        assetContentType: string,
        files: string[],
        rootDirectory: string,
        options?: UploadOptions | undefined
    ): Promise<UploadResponse> {
      checkReleaseAssetName(assetName)
  
      // Get specification for the files being uploaded
      const uploadSpecification: UploadSpecification[] = getUploadSpecification(
        name,
        rootDirectory,
        files
      )
      
    
      if (uploadSpecification.length === 0) {
        core.warning(`No files found that can be uploaded`)
        return {

            size: 0,
            failedItems: []
        };
      }
      
      const uploadHttpClient = new UploadHttpClient()

      // Create an entry for the artifact in the file container
      const response = await uploadHttpClient.createArtifactInFileContainer(
        name,
        options
      )
      if (!response.fileContainerResourceUrl) {
          core.debug(response.toString())
          throw new Error(
          'No URL provided by the Artifact Service to upload an artifact to'
        )
      }
      core.debug(`Upload Resource URL: ${response.fileContainerResourceUrl}`)

      // Upload each of the files that were found concurrently
      const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
         response.fileContainerResourceUrl,
         uploadSpecification,
         options
      )

      // Update the size of the artifact to indicate we are done uploading
      // The uncompressed size is used for display when downloading a zip of the artifact from the UI
      await uploadHttpClient.patchArtifactSize(uploadResult.totalSize, name)

      core.info(
        `Finished uploading artifact ${name}. Reported size is ${uploadResult.uploadSize} bytes. There were ${uploadResult.failedItems.length} items that failed to upload`
      )
      
      return {
        artifactName: name,
        artifactItems: uploadSpecification.map(
            item => item.absoluteFilePath
          ),
        size: uploadResult.uploadSize,
        failedItems: uploadResult.uploadSize
      }
    }
  }