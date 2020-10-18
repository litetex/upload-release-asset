import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fs from 'fs'
import {ReleaseAssetFilePacker} from'./file-packer'
import {findFilesToUpload} from './search'
import {getInputs} from './input-helper'
import {NoFileOptions} from './constants'

async function run(): Promise<void> {
  try {
    const inputs = getInputs()
    const searchResult = await findFilesToUpload(inputs.searchPath)
    if (searchResult.filesToUpload.length === 0) {
      // No files were found, different use cases warrant different types of behavior if nothing is found
      switch (inputs.ifNoFilesFound) {
        case NoFileOptions.warn: {
          core.warning(
            `No files were found with the provided path: ${inputs.searchPath}. No release-assets will be uploaded.`
          )
          break
        }
        case NoFileOptions.error: {
          core.setFailed(
            `No files were found with the provided path: ${inputs.searchPath}. No release-assets will be uploaded.`
          )
          break
        }
        case NoFileOptions.ignore: {
          core.info(
            `No files were found with the provided path: ${inputs.searchPath}. No release-assets will be uploaded.`
          )
          break
        }
      }
      return;
    }

    core.info(
      `With the provided path, there will be ${searchResult.filesToUpload.length} file(s) uploaded`
    )
    core.debug(`Root release-asset is ${searchResult.rootDirectory}`)

    // Setup headers for API call, see Octokit Documentation: 
    // https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset
    const headers = { 
      'content-type': inputs.assetContentType, 
      'content-length': 1 // TODO: Calc content length 
    };

    ReleaseAssetFilePacker.create();

    github.getOctokit(process.env['GITHUB_TOKEN']!)
      // https://github.com/octokit/rest.js/releases/tag/v17.0.0
      .request(`POST ${inputs.uploadUrl}`, {
        headers: headers,
        name: inputs.assetName,
        // Doc: https://github.com/octokit/request.js#data-parameter
        data: fs.readFileSync(assetPath)
      })

    // Todo
    const uploadResponse = {
      assetName: "Implement this!!!",
      browserDownloadUrl: "url",
      failed: false,
    };

    if (uploadResponse.failed) {
      core.setFailed(
        `An error was encountered when uploading ${uploadResponse.assetName}.`
      )
    } else {
      core.info(
        `Release-Asset ${uploadResponse.assetName} has been successfully uploaded!`
      )
      // CHECK
      core.setOutput('browser_download_url', uploadResponse.browserDownloadUrl);
      core.setOutput('browser-download-url', uploadResponse.browserDownloadUrl);
    }
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
