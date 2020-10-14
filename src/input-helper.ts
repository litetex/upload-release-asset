import * as core from '@actions/core'
import {Inputs, NoFileOptions} from './constants'
import {UploadInputs} from './upload-inputs'

/**
 * Helper to get all the inputs for the action
 */
export function getInputs(): UploadInputs {
  /*
   * The deprecated inputs should be removed in the future!
   * The code can then be minimized to e.g.: 
   * const uploadUrl = core.getInput(Inputs.UploadUrl, {required: true})
   */ 

  // upload-url
  const oldUploadUrl = core.getInput(Inputs.OldUploadUrl)
  if(oldUploadUrl)
    core.warning(`Input '${Inputs.OldUploadUrl}' is deprecated!`)

  const uploadUrl = core.getInput(Inputs.UploadUrl) || oldUploadUrl
  if(!uploadUrl)
    core.setFailed(`Input '${Inputs.UploadUrl}' is missing`)

  // path
  const oldAssetPath = core.getInput(Inputs.OldAssetPath)
  if(oldAssetPath)
    core.warning(`Input '${Inputs.OldAssetPath}' is deprecated!`)

  const path = core.getInput(Inputs.Path) || oldAssetPath
  if(!path)
    core.setFailed(`Input '${Inputs.Path}' is missing`)
  
  // asset-name
  const oldAssetName = core.getInput(Inputs.OldAssetName)
  if(oldAssetName)
    core.warning(`Input '${Inputs.OldAssetName}' is deprecated!`)

  const assetName = core.getInput(Inputs.AssetName) || oldAssetName
  if(!assetName)
    core.setFailed(`Input '${Inputs.AssetName}' is missing`)

  // asset-content-type
  const oldAssetContentType = core.getInput(Inputs.OldAssetContentType)
  if(oldAssetContentType)
    core.warning(`Input '${Inputs.OldAssetContentType}' is deprecated!`)

  const assetContentType = core.getInput(Inputs.AssetContentType) || oldAssetContentType
  if(!assetContentType)
    core.setFailed(`Input '${Inputs.AssetContentType}' is missing`)

  // if-no-files-found
  const ifNoFilesFound = core.getInput(Inputs.IfNoFilesFound)
  const noFileBehavior: NoFileOptions = NoFileOptions[ifNoFilesFound]
  if (!noFileBehavior) {
    core.setFailed(
      `Unrecognized ${
        Inputs.IfNoFilesFound
      } input. Provided: ${ifNoFilesFound}. Available options: ${Object.keys(
        NoFileOptions
      )}`
    )
  }

  const inputs = {
    uploadUrl: uploadUrl,
    searchPath: path,
    assetName: assetName,
    assetContentType: assetContentType,
    ifNoFilesFound: noFileBehavior
  } as UploadInputs

  // Pre-process additional inputs here

  return inputs
}
