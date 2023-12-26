import * as coda from "@codahq/packs-sdk";
import * as constants from "./constants";
import * as schemas from "./schemas";
import type * as types from "./types";

/* -------------------------------------------------------------------------- */
/*                              Helper Functions                              */
/* -------------------------------------------------------------------------- */
export async function callApi(
  context: coda.ExecutionContext,
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "POST",
  payload?: { [key: string]: any } | string,
  cacheTtlSecs: number = 60,
  contentType?: string // New parameter for content type
) {
  let url = constants.BASE_URL + endpoint;
  let headers = {};
  let body;

  if (method === "GET") {
    // Ensure that payload is an object for GET requests
    if (typeof payload === 'object' && payload !== null) {
      url = coda.withQueryParams(url, payload);
    }
  } else {
    if (contentType === "multipart/form-data") {
      // For multipart/form-data, payload is already formatted by createMultipartFormData
      headers["Content-Type"] = contentType;
      body = payload;
    } else {
      // Default to JSON
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(payload);
    }
  }

  const response = await context.fetcher.fetch({
    method: method,
    url: url,
    headers: headers,
    body: method !== "GET" ? body : undefined, // Only include body for POST or PUT
    cacheTtlSecs: cacheTtlSecs,
  });

  return response;
}

  /**
 * Gets basic, long-lived account configuration info such as pipelines, customer sources,
 * loss reasons, etc.
 * @returns usually an array of objects, sometimes just an object (e.g. account)
 */
export async function callApiBasicCached(
    context: coda.ExecutionContext,
    endpoint:
      | "files"
      | "accounts"
      // | "customer_sources"
      // | "loss_reasons"
      // | "contact_types"
      // | "custom_field_definitions"
  ) {
    const response = await callApi(
      context,
      endpoint,
      "GET",
    //  { page_size: constants.PAGE_SIZE },
    //  60 * 5 // cache for 5 minutes
    );
    return response.body;
  }


  /**
 * Takes an api response, and prunes it down to just the fields that are defined
 * in the schema for the sync table. We're mimicking what's done automatically with
 * schemas (but we need to do this manually e.g. when returning a dynamic-schema'd
 * object from an action formula)
 * @param record A record (e.g. an api resonse) object that has extraneous properties
 * @param schema A coda schema object defining the properties that should be kept
 * @param additionalKeys Any additional dynamic keys that should be kept
 * @returns A pruned version of the record
 */
export function pruneObjectToSchema(
    record: Record<string, any>,
    schema,
    additionalKeys?: string[]
  ): types.ApiResponse {
    let props: coda.ObjectSchemaProperties = schema.properties;
    let keys = Object.entries(props).map(([key, prop]) => {
      return prop.fromKey || key;
    });
    if (additionalKeys) {
      keys = keys.concat(additionalKeys);
    }
    return Object.entries(record).reduce((result, [key, value]) => {
      if (keys.includes(key)) {
        result[key] = value;
      }
      return result;
    }, {});
  }
  
// Helper function to create multipart/form-data payload
export function createMultipartFormData(args, boundary) {
  let requestData = '';

  args.forEach(arg => {
      requestData += `--${boundary}\r\n`;
      requestData += `Content-Disposition: form-data; name="${arg.key}"\r\n\r\n`;
      requestData += `${arg.value}\r\n`;
  });

  requestData += `--${boundary}--\r\n`;
  return requestData;
}

export async function uploadImage(args, context) {
  const boundary = constants.UniqueBoundary;
  const requestData = createMultipartFormData(args, boundary);
  const contentType = `multipart/form-data; boundary=${boundary}`;

  // Use callApi for the POST request
  let response = await callApi(
    context,
    '/upload', // Replace with the actual endpoint for uploading images
    "POST",
    requestData,
    60,
    contentType
  );

  return response.body.name;
}


/* -------------------------------------------------------------------------- */
/*                           API Response Formatters                          */
/* -------------------------------------------------------------------------- */

   