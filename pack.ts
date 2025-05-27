import FormData from "form-data";
import * as coda from "@codahq/packs-sdk";
import * as schemas from "./schemas";
import * as formulas from "./formulas";
import * as helpers from "./helpers";
import * as constants from "./constants";
import * as types from "./types";

export const pack = coda.newPack();

pack.addNetworkDomain("imagekit.io");

// Per-user authentication to the Imagekit API, using a Private Key in username and 
// an empty string in email an "Authorization: Basic ..." header.
// See https://docs.imagekit.io/api-reference/api-introduction/authentication
pack.setUserAuthentication({
  type: coda.AuthenticationType.WebBasic,
  uxConfig: {
    usernameOnly: true,
    placeholderUsername: "ImageKit Private API Key (starts with private_)",
  },
  getConnectionName: async function (context: coda.ExecutionContext) {
    // For WebBasic, the username is available in context.invocationContext.authenticatedPrincipal.username
    // However, we don't have direct access to the raw credential here to check if it's set.
    // We'll assume if getConnectionName is called, credentials are set.
    // A more robust check might involve a simple API call if available.
    return "ImageKit Account";
  },
});
  
/* -------------------------------------------------------------------------- */
/*                                 Sync Tables                                */
/* -------------------------------------------------------------------------- */

pack.addSyncTable({
  name: "Files",
  identityName: "File",
  schema: schemas.FileSchema,
  dynamicOptions: {
    getSchema: async function (context) {
      return schemas.getSchemaWithCustomFields(context, "files");
    },
  },
  formula: {
    name: "SyncImages",
    description: "Sync images from Imagekit",
    cacheTtlSecs: 0, // don't cache results
    parameters:  [], // No parameters needed as API key scopes to the account
    execute: async function ([], context) { // No parameters to destructure
      // Parameters for the API call, workspaceId is no longer needed here
      const params = {
        sort: "ASC_CREATED",
        includeFileDetails: true,
      };
      return formulas.syncFiles(context, params); // Pass necessary params to syncFiles
    },
  },
});

/* -------------------------------------------------------------------------- */
/*                                  Formulas                                  */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                   Actions                                  */
/* -------------------------------------------------------------------------- */

/* ------------------------------     Files     ----------------------------- */

pack.addFormula({
  name: "UploadImage",
  description: "Upload the image.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.Image,
      name: "image",
      description: "Image to upload.",
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "fileName",
      description:
        "The filename to upload to. Default: the original filename of the file.",
      optional: false,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "useUniqueFileName",
      description:
        "Whether to use a unique filename for this file or not. Accepts true or false. If set true, ImageKit.io will add a unique suffix to the filename parameter to get a unique filename. If set false, then the image is uploaded with the provided filename parameter, and any existing file with the same name is replaced. Default value - true",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "tags",
      description:
        "Comma-separated value of tags in the format tag1,tag2,tag3. For example - t-shirt,round-neck,men",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "folder",
      description:
        "he folder path (e.g. /images/folder/) in which the image has to be uploaded. If the folder(s) didn't exist before, a new folder(s) is created. The nesting of folders can be at most 50 levels deep. The folder name can contain: - Alphanumeric Characters: a-z , A-Z , 0-9 (including unicode letters, marks, and numerals in other languages) - Special Characters: / _ and - - Using multiple / creates a nested folder. Default value - /",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "isPrivateFile",
      description:
        "Whether to mark the file as private or not. This is only relevant for image type files.- Accepts true or false. - If set true, the file is marked as private which restricts access to the original image URL and unnamed image transformations without signed URLs. Without the signed URL, only named transformations work on private images. Default value - false",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "isPublished",
      description:
        "Whether to upload file as published or not. Default value - true",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "customCoordinates",
      description:
        "Define an important area in the image. This is only relevant for image type files. To be passed as a string with the x and y coordinates of the top-left corner, and width and height of the area of interest in the format x,y,width,height. For example - 10,10,100,100 Can be used with fo-customtransformation. If this field is not specified and the file is overwritten, then customCoordinates will be removed.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "responseFields",
      description:
        "Comma-separated values of the fields that you want the API to return in the response. For example, set the value of this field to tags,customCoordinates,isPrivateFile to get the value of tags, customCoordinates, isPublished and isPrivateFile in the response. Accepts combination of tags, customCoordinates, isPrivateFile, embeddedMetadata, customMetadata, and metadata.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "extensions",
      description:
        "Stringified JSON object with an array of extensions to be applied to the image. For reference about extensions read here. https://docs.imagekit.io/extensions/overview",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "webhookUrl",
      description:
        "The final status of pending extensions will be sent to this URL. To learn more about how ImageKit uses webhooks, refer here. https://docs.imagekit.io/extensions/overview#webhooks",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "overwriteFile",
      description:
        "Default is true. If overwriteFile is set to false and useUniqueFileName is also false, and a file already exists at the exact location, upload API will return an error immediately.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "overwriteAITags",
      description:
        "Default is true. If set to true and a file already exists at the exact location, its AITags will be removed. Set overwriteAITags to false to preserve AITags",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "overwriteTags",
      description:
        "Default is true. If the request does not have tags , overwriteTags is set to true and a file already exists at the exact location, exiting tags will be removed. In case the request body has tags, setting overwriteTags to false has no effect and request's tags are set on the asset.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "overwriteCustomMetadata",
      description:
        "Default is true. If the request does not have customMetadata , overwriteCustomMetadata is set to true and a file already exists at the exact location, exiting customMetadata will be removed. In case the request body has customMetadata, setting overwriteCustomMetadata to false has no effect and request's customMetadata is set on the asset.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "customMetadata",
      description:
        "Stringified JSON key-value data to be associated with the asset. Checkout overwriteCustomMetadata parameter to understand default behaviour. Before setting any custom metadata on an asset you have to create the field using custom metadata fields API.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "transformation",
      description:
        "Stringified JSON object with the properties: pre - Accepts a 'string' containing a valid transformation. Used for requesting a pre-transformation for an image or a video file. post - Accepts an array of objects with the following properties: type: Either transformation, gif-to-video, thumbnail or abs value: A 'string' corresponding to the required transformation. Required if type is transformation or abs. Optional if type is gif-to-video or thumbnail. protocol: Either hls or dash. Only applicable if type is abs. Read more about Adaptive bitrate streaming (ABS). Used for requesting post-transformations for an image or a video file.",
      optional: true,
    }),
  ],
  resultType: coda.ValueType.String, 
  codaType: coda.ValueHintType.Url,
  isAction: true,
  execute: async function (args, context) {
  // Define the file attributes in the formula, workspaceId removed from destructuring
    const [image, fileName, useUniqueFileName, tags, folder, isPrivateFile, isPublished, customCoordinates, responseFields, extensions, webhookUrl, overwriteFile, overwriteAITags, overwriteTags, overwriteCustomMetadata, customMetadata, transformation ] = args;
    
    // Prepare the arguments for uploadImage, workspaceId removed
    const uploadArgs = {
      image, 
      fileName, 
      useUniqueFileName, 
      tags, 
      folder, 
      isPrivateFile, 
      isPublished, 
      customCoordinates, 
      responseFields, 
      extensions, 
      webhookUrl, 
      overwriteFile, 
      overwriteAITags, 
      overwriteTags, 
      overwriteCustomMetadata, 
      customMetadata, 
      transformation,
    };

    // Upload the image
    let url = await helpers.uploadImage(uploadArgs, context);
    // Return the URL of the uploaded image.
    return url;
  },
});



// Define the formula
pack.addFormula({
  name: 'UpdateFileDetails',
  description: 'Updates details of a file in ImageKit',
  isAction: true,

  // Define the parameters the formula will accept
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'fileId',
      description: 'The unique ID of the file to update',
    }),
    coda.makeParameter({
      type: coda.ParameterType.StringArray,
      name: 'tags',
      description: 'Tags associated with the file',
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'customCoordinates',
      description: 'Custom coordinates of the file',
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'customMetadata',
      description: 'Custom metadata of the file',
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'extensions',
      description: 'Extensions for the file update',
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'webhookUrl',
      description: 'Webhook URL to be called on successful file update',
      optional: true,
    }),
    // Add other parameters as needed
  ],

  // Define the return type of the formula
  resultType: coda.ValueType.Object,

  // The function to execute when the formula is used
  execute: async function ([fileId, tags, customCoordinates, customMetadata, extensions, webhookUrl], context) {
    // Correct arguments for execute, matching defined parameters
    let parsedCustomMetadata: object | undefined;

    if (customMetadata === "") { // Explicitly empty string
      parsedCustomMetadata = {}; // Set to empty object to clear existing metadata
    } else if (customMetadata && typeof customMetadata === 'string') {
      if (customMetadata.trim() === '{}') { // String is "{}"
        parsedCustomMetadata = {}; // Also treat as instruction to clear
      } else {
        try {
          parsedCustomMetadata = JSON.parse(customMetadata);
          // Iterate over parsedCustomMetadata and change empty strings to null
          if (parsedCustomMetadata && typeof parsedCustomMetadata === 'object') {
            for (const key in parsedCustomMetadata) {
              if (Object.prototype.hasOwnProperty.call(parsedCustomMetadata, key) && parsedCustomMetadata[key] === "") {
                parsedCustomMetadata[key] = null;
              }
            }
          }
        } catch (e) {
          throw new coda.UserVisibleError('Invalid JSON string provided for Custom Metadata: ' + e.message + ". Input was: " + customMetadata);
        }
      }
    }    
    // If customMetadata was null/undefined from Coda, parsedCustomMetadata remains undefined.

    const payload: { [key: string]: any } = {
      tags: tags,
      customCoordinates: customCoordinates,
      customMetadata: parsedCustomMetadata,
      extensions: extensions,
      webhookUrl: webhookUrl,
    };

    // Filter out undefined parameters
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const response = await helpers.callApi(
      context,
      `/files/${fileId}/details`,
      "PATCH",
      payload
    );

    // Return the response from the API call
    return response.body;
  },
  schema: schemas.FileSchema
});

// New helper formula to create a custom metadata object from a JSON string
pack.addFormula({
  name: "CreateCustomMetadataFromJSON",
  description: "Parses a JSON string and creates a custom metadata object, omitting keys if their values in the JSON are empty strings or null. Intended for use with the UpdateFileDetails formula.",
  parameters: [
    coda.makeParameter({ 
      type: coda.ParameterType.String, 
      name: "metadataJsonString", 
      optional: true, 
      description: "A JSON string representing the custom metadata. E.g., '{\"shade\": \"White\", \"plating\": \"\", \"notes\": null}'." 
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: schemas.CustomMetadataSchema, // Use the exported generic object schema
  execute: async function ([metadataJsonString], context) {
    const cleanedMetadata: { [key: string]: any } = {};

    if (!metadataJsonString || metadataJsonString.trim() === "" || metadataJsonString.trim() === "{}") {
      return {}; // Return an empty object if input is blank, empty, or just an empty JSON object string
    }

    let parsedInput: any;
    try {
      parsedInput = JSON.parse(metadataJsonString);
    } catch (e) {
      throw new coda.UserVisibleError('Invalid JSON string provided: ' + e.message + ". Input was: " + metadataJsonString);
    }

    if (parsedInput && typeof parsedInput === 'object' && !Array.isArray(parsedInput)) {
      for (const key in parsedInput) {
        if (Object.prototype.hasOwnProperty.call(parsedInput, key)) {
          const value = parsedInput[key];
          if (value !== "" && value !== null) { // Only include if value is not an empty string and not null
            cleanedMetadata[key] = value;
          }
        }
      }
    } else {
      throw new coda.UserVisibleError('Input JSON string must resolve to a JSON object. Input was: ' + metadataJsonString);
    }
    
    return cleanedMetadata;
  },
});
