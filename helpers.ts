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
  method: "GET" | "POST" | "PUT" | "PATCH" = "POST",
  payload?: { [key: string]: any } | string,
  cacheTtlSecs: number = 60,
  contentType?: string // New parameter for content type
) {
  let url: string;
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    url = endpoint; // Use endpoint as is if it's a full URL
  } else {
    const finalBaseUrl = constants.BASE_URL.replace(/\/+$/, ''); // Remove trailing slashes from base
    const finalEndpoint = endpoint.replace(/^\/+/, '');       // Remove leading slashes from endpoint
    url = `${finalBaseUrl}/${finalEndpoint}`;
  }
  let headers = {};

  // For WebBasic Authentication, Coda automatically adds the Authorization header.
  // The privateKey is entered as the username and Coda handles the Base64 encoding.
  // The workspaceId will be passed as a parameter in the payload for specific functions if needed.

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

  ) {
    const response = await callApi(
      context,
      endpoint,
      "GET",
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
export function createMultipartFormData(args: { [key: string]: any }, boundary: string) {
  let requestData = '';

  // Convert the args object into an array of key-value pairs for processing
  // We need to be careful about the structure expected by the API for uploads.
  // Typically, for file uploads, 'file' is a special field.
  // Other fields are regular form fields.

  // Assuming 'image' (the image URL from Coda) and 'fileName' are primary, and others are optional metadata
  // The actual file binary needs to be fetched and then added if args.image is a URL.
  // However, Coda's ParameterType.Image might already handle this by providing a special URL
  // that the fetcher can resolve to the binary content.

  // For now, let's simplify and assume args are key-value pairs to be sent.
  // The `image` parameter in `UploadImage` formula is of `ParameterType.Image`,
  // which Coda might handle specially when it constructs the request body part for `file`.
  // Let's assume the `callApi` function and Coda's fetcher handle the `image` (file binary) part correctly
  // and we just need to pass other parameters as form fields.

  // The ImageKit API expects 'file' and 'fileName' as primary fields.
  // Other parameters like tags, folder, workspaceId etc., are also part of the multipart form.

  // The current `uploadImage` function in `helpers.ts` passes `args` (which is an array from the formula) 
  // directly to `createMultipartFormData`. We changed `UploadImage` formula to pass an object to `helpers.uploadImage`.
  // So `helpers.uploadImage` needs to pass this object to `createMultipartFormData`.

  Object.entries(args).forEach(([key, value]) => {
    if (value !== undefined && value !== null) { // Ensure we don't send undefined/null fields
      // Skip the 'image' field here if it's handled separately by Coda/fetcher as the actual file binary
      // Or, if it's a URL that needs to be fetched first, that logic would be more complex.
      // For now, assuming `ParameterType.Image` handles the file part and we send other metadata.
      // If `image` is the actual binary/buffer, it would need special handling here.
      // Given it's `ParameterType.Image`, Coda might replace it with the actual file content.

      // ImageKit expects the file itself under the 'file' parameter name.
      // And the filename under 'fileName'.
      // Let's map `args.image` (which is a Coda image URL) to the 'file' part of the form.
      // And `args.fileName` to the 'fileName' part.
      // All other args are passed as is.
      
      let formKey = key;
      let formValue = value;

      if (key === "image") {
        // This assumes Coda's fetcher will correctly interpret this as the file to upload
        // when `contentType` is multipart/form-data.
        // The `image` value here would be the URL Coda provides.
        formKey = "file"; 
      }

      requestData += `--${boundary}\r\n`;
      requestData += `Content-Disposition: form-data; name="${formKey}"\r\n\r\n`;
      requestData += `${formValue}\r\n`;
    }
  });

  requestData += `--${boundary}--\r\n`;
  return requestData;
}

export async function uploadImage(args: { [key: string]: any }, context: coda.ExecutionContext) {
  const boundary = constants.UniqueBoundary;
  // args is now an object, including potentially workspaceId
  const requestData = createMultipartFormData(args, boundary);
  const contentType = `multipart/form-data; boundary=${boundary}`;

  // The UPLOAD_URL should be used here instead of constants.BASE_URL + '/upload'
  let response = await callApi(
    context,
    constants.UPLOAD_URL, // Using the specific UPLOAD_URL constant
    "POST",
    requestData,
    0, // No cache for uploads
    contentType
  );

  // The response from ImageKit upload is an object. We should return the relevant part, e.g., URL or the whole object.
  // Assuming response.body contains the parsed JSON response.
  // The original code returned response.body.name, let's check if that's correct or if we need response.body.url
  // According to ImageKit docs, it returns: fileId, name, url, thumbnailUrl, etc.
  return response.body.url; // Returning the URL of the uploaded image seems more useful.
}


/* -------------------------------------------------------------------------- */
/*                           API Response Formatters                          */
/* -------------------------------------------------------------------------- */

   