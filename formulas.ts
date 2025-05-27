import * as coda from "@codahq/packs-sdk";
import * as types from "./types";
import * as helpers from "./helpers";
import * as schemas from "./schemas";
import * as constants from "./constants";

/* -------------------------------------------------------------------------- */
/*                            Sync Table Functions                            */
/* -------------------------------------------------------------------------- */

export async function syncFiles(context: coda.SyncExecutionContext, params: { [key: string]: any }) {
    const apiParams = {
      //type: "file", // Assuming this was commented out for a reason
      sort: "ASC_CREATED",
      includeFileDetails: true,
      //https://docs.imagekit.io/api-reference/media-api/list-and-search-files
      ...params, // Spread the incoming params (e.g., sort, includeFileDetails)
    };

    const response = await helpers.callApi(context, "files", "GET", apiParams);
  
    // Process the results
    let files: types.FileApiResponse[] = response.body;
  
    return {result: files};
  
  }