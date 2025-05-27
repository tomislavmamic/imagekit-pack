export const BASE_URL = "https://api.imagekit.io/v1";
export const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
export const PAGE_SIZE = 50; // max accepted by the API is 200, but that can crash Pack execution

export const accountIDRegex = new RegExp( "https://ik\.imagekit\.io/([^/]+)/" );

// Regular expression that matches Coda-hosted images.
export const HostedImageUrlRegex = new RegExp("^https://(?:[^/]*\.)?codahosted.io/.*");
export const UniqueBoundary = "--------------------------727386185025104152380555";