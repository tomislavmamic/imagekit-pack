import * as coda from "@codahq/packs-sdk";
import * as helpers from "./helpers";

/* -------------------------------------------------------------------------- */
/*                            Common object schemas                           */
/* -------------------------------------------------------------------------- */

// Making CustomMetadataSchema generic to accept any key-value pairs
export const CustomMetadataSchema = coda.makeObjectSchema({
  type: coda.ValueType.Object,
  // codaType: coda.ValueHintType.Json, // 'Json' is not available
  properties: {},
  includeUnknownProperties: true, // Retain properties not explicitly defined
  // additionalProperties: coda.makeSchema({ type: coda.ValueType.String }), // Remove this fallback
});

/* -------------------------------------------------------------------------- */
/*                             Sync table schemas                             */
/* -------------------------------------------------------------------------- */

// https://docs.imagekit.io/api-reference/media-api
export const FileSchema = coda.makeObjectSchema({
    type: coda.ValueType.Object,
    idProperty: "fileId",
    displayProperty: "name",
    featuredProperties: [
        "fileId",
        "name",
        "tags",
        "customCoordinates",
        "thumbnail",
        "height",
        "width"
    ],
    identity: { name: "File" },
    includeUnknownProperties: true,
    properties: {
        type: { type: coda.ValueType.String },
        name: { type: coda.ValueType.String },
        createdAt: { type: coda.ValueType.String },
        updatedAt: { type: coda.ValueType.String },
        fileId: { type: coda.ValueType.String, fromKey: "fileId" },
        tags: { type: coda.ValueType.Array ,
          items: coda.makeSchema({ type: coda.ValueType.String }),
        },
        AITags: { type: coda.ValueType.Array ,
          items: coda.makeObjectSchema({ 
            idProperty: "name",
            displayProperty: "name",
            properties: {
              name: {type: coda.ValueType.String },
              confidence: {type: coda.ValueType.Number },
              source: {type: coda.ValueType.String }
            }
          }),
        },
        versionInfo: coda.makeObjectSchema({ 
          type: coda.ValueType.Object ,
          idProperty: "id",
          displayProperty: "name",
            properties: {
              id: { type: coda.ValueType.String },
              name: { type: coda.ValueType.String }
            }
        }),
        embeddedMetadata: { type: coda.ValueType.String },
        customCoordinates: { type: coda.ValueType.Array ,
          items: coda.makeSchema({ type: coda.ValueType.Number }),
        },
        customMetadata: CustomMetadataSchema,
        isPrivateFile: { type: coda.ValueType.Boolean },
        url: { 
          type: coda.ValueType.String,
          codaType: coda.ValueHintType.Url, 
        },
        thumbnail: { 
          type: coda.ValueType.String,
          codaType: coda.ValueHintType.ImageAttachment 
        },
        fileType: { type: coda.ValueType.String },
        filePath: { type: coda.ValueType.String },
        height: { type: coda.ValueType.Number },
        width: { type: coda.ValueType.Number },
        size: { type: coda.ValueType.Number },
        hasAlpha: { type: coda.ValueType.Boolean },
        mime: { type: coda.ValueType.String}
}})


export const AccountSchema = coda.makeObjectSchema({
  type: coda.ValueType.Object,
  idProperty: "fileId",
  displayProperty: "name",
  featuredProperties: [
      "name",
      "url",
  ],
  identity: { name: "File" },
  includeUnknownProperties: true,
  properties: {

  }}
)

/* -------------------------------------------------------------------------- */
/*                         Dynamic Sync Table Schemas                         */
/* -------------------------------------------------------------------------- */

export async function getSchemaWithCustomFields(
    context: coda.ExecutionContext,
    recordType: "files" | "accounts"
  ) {
    console.log("Getting schema with custom fields for ", recordType);
    // First, load up the appropriate static schema, which we'll add on to
    let staticSchema: coda.Schema;
    switch (recordType) {
      case "files":
        staticSchema = FileSchema;
        break;
      case "accounts":
        staticSchema = AccountSchema;
        break;
      default:
        throw new coda.UserVisibleError(
          "There was an error generating the sync table"
        );
    }
  
    // Start with the static properties
    let properties: coda.ObjectSchemaProperties = staticSchema.properties;
  
    let schema = coda.makeObjectSchema({
      properties: properties,
      displayProperty: staticSchema.displayProperty,
      idProperty: staticSchema.idProperty,
      featuredProperties: staticSchema.featuredProperties,
      identity: staticSchema.identity,
    });
  
    console.log("Returning schema: ", JSON.stringify(schema));
    // Return an array schema as the result.
    return coda.makeSchema({
      type: coda.ValueType.Array,
      items: schema,
    });
  }

export const BulkUpdateFileDetailsResponseSchema = coda.makeObjectSchema({
  properties: {
    successfullyUpdatedFileIds: {
      type: coda.ValueType.Array,
      items: coda.makeSchema({ type: coda.ValueType.String }),
      description: "List of file IDs that were successfully updated.",
    },
    partiallyUpdatedFileIds: {
      type: coda.ValueType.Array,
      items: coda.makeSchema({ type: coda.ValueType.String }),
      description: "List of file IDs that were partially updated (if any; ImageKit might not use this often for metadata but good to have).",
    },
    failedFileIds: {
      type: coda.ValueType.Array,
      items: coda.makeSchema({ type: coda.ValueType.String }),
      description: "List of file IDs that failed to update.",
    },
  },
  displayProperty: "successfullyUpdatedFileIds",
  identity: { // Optional, but can be useful if you ever sync these results
    name: "BulkUpdateStatus"
  }
});