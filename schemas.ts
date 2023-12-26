import * as coda from "@codahq/packs-sdk";
import * as helpers from "./helpers";

/* -------------------------------------------------------------------------- */
/*                            Common object schemas                           */
/* -------------------------------------------------------------------------- */

const CustomMetadataSchema = coda.makeObjectSchema({ 
  //https://docs.imagekit.io/api-reference/custom-metadata-fields-api
  type: coda.ValueType.Object,
  idProperty: "id",
  displayProperty: "name",
  properties: {
    id: { type: coda.ValueType.String },
    name: { type: coda.ValueType.String },
    stoneColor: { type: coda.ValueType.String },
    stoneShade: { type: coda.ValueType.String },
    stoneMaterial: { type: coda.ValueType.String },
    stoneSize: { type: coda.ValueType.Number },
    ringType: { type: coda.ValueType.String },
    ringSize: { type: coda.ValueType.Number },
    imageOrder: { type: coda.ValueType.Number },
  }});

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
  /*
    // Go get the list of custom fields
    let allCustomFields = await helpers.callApiBasicCached(
      context,
      "custom_field_definitions"
    );
  
    // Filter to just the custom fields that apply to this record type
    let applicableCustomFields = allCustomFields.filter((customField) =>
      customField.available_on.includes(recordType)
    );
  
    // Format the custom fields as schema properties, and add them to the schema
    for (let customField of applicableCustomFields) {
      let name = customField.name;
      console.log("Field name:", name);
      let propertySchema;
      // Build appropriate field schemas based on the type of custom field
      // Note: we're not currently fully implementing the "Connect" field type,
      // but could in future given sufficient user demand
      switch (customField.type) {
        case "Url":
          propertySchema = coda.makeSchema({
            type: coda.ValueType.String,
            codaType: coda.ValueHintType.Url,
          });
          break;
        case "Date":
          propertySchema = coda.makeSchema({
            type: coda.ValueType.Number,
            codaType: coda.ValueHintType.Date,
          });
          break;
        case "Checkbox":
          propertySchema = coda.makeSchema({ type: coda.ValueType.Boolean });
          break;
        case "Float":
          propertySchema = coda.makeSchema({ type: coda.ValueType.Number });
          break;
        case "Percentage":
          propertySchema = coda.makeSchema({ type: coda.ValueType.Number });
          break;
        case "Currency":
          propertySchema = coda.makeSchema({
            type: coda.ValueType.Number,
            codaType: coda.ValueHintType.Currency,
          });
          break;
        case "MultiSelect":
          propertySchema = coda.makeSchema({
            type: coda.ValueType.Array,
            items: coda.makeSchema({
              type: coda.ValueType.String,
            }),
          });
          break;
        default:
          // including String, Text, Dropdown, Connect
          propertySchema = coda.makeSchema({ type: coda.ValueType.String });
      }
      // Add the custom field property to the schema
      console.log("Property Schema:", JSON.stringify(propertySchema));
      properties[name] = propertySchema;
    }
  */
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