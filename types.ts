
// A custom type that bundles together the image buffer and content type.
export interface ImageData {
  buffer: Buffer,
  contentType: string,
  fileName: string,
}


/* -------------------------------------------------------------------------- */
/*                          Imagekit API Object Types                         */
/* -------------------------------------------------------------------------- */

// Individual properties that appear within API responses
export interface CustomFieldApiProperty {
  // The version of custom fields that appear on a record, such as an
  // opportunity, person, or company.
  custom_field_definition_id: string;
  value: string | number | boolean;
  computed_value?: string | number | boolean;
}


// Complete API responses
export interface ApiResponse {
  id?: string;
  name?: string;
  [otherOptions: string]: any;
}
export interface FileApiResponse extends ApiResponse {
  file_id?: string;
  type?: string;
  created_at?: number;
  updated_at?: number;
  tags?: string[];
  ai_tags?: object[];
  version_info?: object;
  embedded_metadata?: object;
  custom_coordinates?: number[];
  custom_metadata?: CustomMetadataApiResponse;
  isPrivateFile?: boolean;
  url?: string;
  thumbnail?: string;
  file_type?: string;
  file_path?: string;
  height?: number;
  width?: number;
  size?: number;
  has_alpha?: boolean;
  mime?: string;
}

export interface CustomFieldDefinitionApiResponse {
  id: string;
  name: string;
  data_type: "String" | "Tumber" | "Dropdown" | "Date";
  available_on: string[];
  options?: {
    id: string;
    name: string;
    rank: number;
  };
}

export interface CustomMetadataApiResponse {
  id: string;
  name: string;
  data_type: "String";
  available_on: string[];
  options?: {
    name: string;
    value: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                            Formula Return Types                            */
/* -------------------------------------------------------------------------- */