import * as coda from "@codahq/packs-sdk";
import * as types from "./types";
import * as helpers from "./helpers";
import * as schemas from "./schemas";
import * as constants from "./constants";

/* -------------------------------------------------------------------------- */
/*                            Sync Table Functions                            */
/* -------------------------------------------------------------------------- */

export async function syncFiles(context: coda.SyncExecutionContext) {
    const response = await helpers.callApi(context, "files", "GET", 
      {
        //type: "file",
        sort: "ASC_CREATED"
        //https://docs.imagekit.io/api-reference/media-api/list-and-search-files
      }
    );
  
    // Process the results
    let files: types.FileApiResponse[] = response.body;
  
    return {result: files};
  
  }