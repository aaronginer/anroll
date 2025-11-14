// model settings constants
export const INTERPOLATION_FACTOR: number = 0.25;
export const D_FACTOR: number = 0.0;
export const D_FACTOR_RESTRICT: boolean = true;
export const RADIUS_MODIFIER: number = 2 * Math.PI;
export const ENFORCE_ISOTROPY: boolean = false;
export const TILT: number = 0;

// optimization settings constants
export const OPTIMIZATION_ACTIVE: boolean = false;
export const OPTIMIZATION_MAX_ITERATIONS: number = 1000;
export const OPTIMIZE_RADIUS_MODIFIER: boolean = false;
export const OPTIMIZE_INTERPOLATION_FACTOR: boolean = false;
export const OPTIMIZE_DFACTOR: boolean = false;

// image settings constants
export const IMAGE_ACTIVE: boolean = true;
export const IMAGE_ROTATION: number = 0;
export const VERTICAL_SHIFT: number = 0;
export const CROP_TOP: number = 0;
export const CROP_BOTTOM: number = 0;
export const CROP_RIGHT: number = 0;
export const CROP_LEFT: number = 0;
export const IMAGE_REGION_SELECTOR_ACTIVE: boolean = false; // whether the image region selector is active
export const PREVIEW_SCALE: number = 0.5;
export const MAX_CROP: number = 0.95;

// grid settings constants
export const GRID_ACTIVE: boolean = false;
export const GRID_UNIFORM: boolean = false;
export const GRID_THICKNESS: number = 1;
export const GRID_X: number = 21;
export const GRID_Y: number = 21;

// error settings constants
export const ERRORS_ACTIVE: boolean = false;
export const ERRORS_USE_GPU: boolean = false;
export const ERRORS_SHOW_LEGEND: boolean = true;
export const ERRORS_QUALITY: number = 0.1;
export const ERROR_OVERLAY_TARGET: string = "";
export const ERROR_OVERLAY_OPACITY: number = 0.5;

// plot settings constants
export const PLOT_INTERP: boolean = false;
export const PLOT_IFCURVE: boolean = false;

// adanced settings constants
export const SPLINE_SMOOTHING: number = 0.005;
export const COMMAND_QUEUE_CAPACITY: number = 1;

// export
export const EXPORT_INCLUDE_ERROR_MAPS: boolean = false;
export const EXPORT_INCLUDE_MASK: boolean = false;
export const EXPORT_INCLUDE_UNROLLING: boolean = false;
export const RENDER_MAX_RESOLUTION: number = 1000;

// network
export const IPA: string = "localhost";
export const PORT: string = "57777";