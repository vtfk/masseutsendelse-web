/*
  Import dependencies
*/
// Standardized errors
import AppError from "../vtfk-errors/AppError";
// For transforming coordinates between systems
import proj4 from 'proj4';
// For calculating the area of polygons
import { polygon as turfPolygon }  from '@turf/helpers';
import turfArea from '@turf/area';
// Parsers
const dxf = require('./parsers/dxf');

/*
  Variables and constants
*/
// Add definitions to proj4
proj4.defs([
  [
    'EPSG:4326',
    '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'
  ],
  [
    'EPSG:5972',
    '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs'
  ],
  [
    'EPSG:25832',
    '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs'
  ]
]);
/*
  Support functions
*/
async function readFile(file) {
  // Always return a Promise
  return new Promise((resolve, reject) => {
    let content = '';
    const reader = new FileReader();
    // Wait till complete
    reader.onloadend = function(e) {
      content = e.target.result;
      // const result = content.split(/\r\n|\n/);
      resolve(content);
    };
    // Make sure to handle error states
    reader.onerror = function(e) {
      reject(e);
    };
    reader.readAsText(file);
  });
}

function copy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 
 * @param {Array[x, y]} coordinateSample A single coordinate in [x = EASTING, y = NORTHING] format
 * @returns 
 */
function guessEPSGCodeAndOrder(coordinateSample) {
  console.log('Guessing coordinate system for coordinate:');
  console.log(coordinateSample);
  let reversed = false;
  let code = undefined;
  // Make two passes to attempt to determine what EPSG code the coordinate falls under
  // The second pass is with X and Y reversed to check if the data is passed in with northing, easting formating
  for(let i = 0; i <= 1; i++) {
    if(i == 1) {
      reversed = true;
      coordinateSample = [coordinateSample[1], coordinateSample[0]];
    }
    if(coordinateSample[0] > -90 && coordinateSample[0] < 90 && coordinateSample[1] > -180 && coordinateSample[1] < 180) code = 'EPSG:4326'
    if(coordinateSample[0] > 322361.85 && coordinateSample[0] < 637396.44 && coordinateSample[1] > 6424859.18 && coordinateSample[1] < 7296440.28) code = 'EPSG:5972'
    if(coordinateSample[0] > -1877994.66 && coordinateSample[0] < 3932281.56 && coordinateSample[1] > 836715.13 && coordinateSample < 9440581.95) code = 'EPSG:25832'
  }

  if(!code) return undefined;

  return {
    code: code,
    reversed: reversed
  }
}
/**
 * 
 * @param {[x: number, y: number, z?: number]} vertice 
 */
function reverseXY(vertice) {
  const tmpX = vertice[0]
  vertice[0] = vertice[1];
  vertice[1] = tmpX;
  return vertice;
}

/*
  Class
*/
class PolyParser {
  /**
   * 
   * @param {HTMLFile} file A file uploaded to a input-field
   * @param {object} options 
   * @param {boolean} options.inverseXY Should the X and Y coordinates switch places?
   * @param {array} EPSG.code Proj4 projection string to transform from
   * @param {string} options.toProj4Projection Proj4 projection string to transform to
   * 
   */
  async parse(
    file,
    options
    )
    {
    // Default options
    let defaultOptions = {
      inverseXY: false,
      fromProj4Projection: '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs',
      toProj4Projection: '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'
    }
    
    // Set options
    if(options) {
      const tmpOptions = JSON.parse(JSON.stringify(options));
      options = defaultOptions;
      for(let key in tmpOptions) {
        options[key] = tmpOptions[key];
      }
    } else {
      options = defaultOptions;
    }

    // Input validation
    if(!file) throw new AppError('No file provided', 'No file was provided for parsing');
    if(file.size === 0) throw new AppError('File error', 'The provided file is empty');
    if(!file.name) throw new AppError('File error', `No 'name' property was provided in the file`);
    if(!file.name.includes('.')) throw new AppError('File error', 'The file name does not contain any file extension');
    
    // Define the return object
    let returnObj = {
      extremes: {},
      area: null,
      polygons: [],
    }

    // Get the file extension of the file
    let extension = file.name.substring(file.name.lastIndexOf('.') + 1);

    // Attempt to read the file
    const fileData = await readFile(file.data);
    if(!fileData || fileData.length === 0) { throw new AppError('The file is empty', 'We were able to read the file, but it was empty'); }

    // Attempt to parse the file
    let parsedData = undefined;
    switch(extension) {
      case 'dxf':
        parsedData = dxf.parse(fileData);
        break;
      default:
        throw new AppError('Could not parse', `We were unable to find a parser for filetype '${extension}'`);
    }

    // Make sure that we got valid data back
    if(!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) throw new AppError('Unable to parse file', 'We attempted to parse the file but could not find any data');

    // Make a initial check for the first vertice in the first polygon so it can be used to determine the EPSG code
    if(!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) throw new AppError('Polygon is empty', 'One or more polygons in the file is empty');
    if(!parsedData[0].vertices || !Array.isArray(parsedData[0].vertices) || parsedData[0].vertices.length === 0) throw new AppError('Polygon is empty', 'One or more polygons in the file is empty');

    // Attempt to determine the EPSG code and data direction
    const EPSG = guessEPSGCodeAndOrder(parsedData[0].vertices[0]);
    if(!EPSG.code) throw new AppError('Unsupported coordinate system', 'Could not determine the coordinate system based on the coordinates', [parsedData.polygons[0].vertices [0]]);

    parsedData.forEach((polygon) => {
      // if(i !== 1) return;
      // Make sure that the polygon contains vertices
      if(!polygon.vertices || !Array.isArray(polygon.vertices) || polygon.vertices.length === 0) throw new AppError('Polygon is empty', 'One or more polygons in the file is empty');
      
      // Reverse all coordinates if they are evaluated to be in reverse order
      if(EPSG.reversed) {
        console.log('REVERSING VERTICES');
        for(let vertice of polygon.vertices) {
          vertice = [vertice[1], vertice[0]];
        }
      }
      
      // Make sure that the vertices are selfclosing
      if(polygon.vertices[0] != polygon.vertices[polygon.vertices.length]) {
        polygon.vertices.push(copy(polygon.vertices[0]));
      }
      
      // Validate and calculate the extreme points for the vertices
      let extremeNorth = copy(polygon.vertices[0]);
      let extremeWest = copy(polygon.vertices[0]);
      let extremeEast = copy(polygon.vertices[0]);
      let extremeSouth = copy(polygon.vertices[0]);

      polygon.vertices.forEach((vertice, i) => {
        // Make sure that all of the vertices in the polygon is in [x, y] format
        if(!vertice || vertice.length < 2) throw new AppError('Vertice is incomplete', `The vertice in position ${i} contains only ${vertice.length} coordinates`, [vertice]);
        if(typeof vertice[0] !== 'number' || typeof vertice[1] !== 'number') throw new AppError('Vertice is invalid', `The vertice in position ${i} contains coordinates that are not numbers`, [vertice]);
        
        // Check if this vertice is one of the extremes
        let vcopy = JSON.parse(JSON.stringify(vertice));
        if(vertice[0] < extremeWest[0]) extremeWest = vcopy;
        if(vertice[0] > extremeEast[0]) extremeEast = vcopy;
        if(vertice[1] > extremeNorth[1]) extremeNorth = vcopy;
        if(vertice[1] < extremeSouth[1]) extremeSouth = vcopy;
      })

      // Check that the polygon has atleast 4 points
      if(polygon.vertices.length < 4) throw new AppError('Polygon has to few vertices', `One of the polygons has only ${polygon.vertices.length} it needs atleast 4`);

      // Calculate the centerpoints
      const center = [
        (extremeWest[0] + extremeEast[0]) / 2,
        (extremeSouth[1] + extremeNorth[1]) / 2
      ]

      // Calculate the area of the polygon
      let tp = turfPolygon([copy(polygon.vertices)])
      let area = turfArea(tp);

      // Update the return object
      returnObj.polygons.push({
        metadata: polygon.metadata,
        extremes: {
          north: extremeNorth,
          west: extremeWest,
          east: extremeEast,
          south: extremeSouth,
          center: center
        },
        area: area,
        vertices: polygon.vertices
      })
    })

    // Find the global extremes
    // Set as the first extremes as a starting point
    let globalExtremeNorth = copy(returnObj.polygons[0].extremes.north)
    let globalExtremeWest = copy(returnObj.polygons[0].extremes.west)
    let globalExtremeEast = copy(returnObj.polygons[0].extremes.east)
    let globalExtremeSouth = copy(returnObj.polygons[0].extremes.south)
    // Attempt to find extremer extremes
    returnObj.polygons.forEach((polygon) => {
      if(polygon.extremes.north[1] > globalExtremeNorth[1]) globalExtremeNorth = copy(polygon.extremes.north);
      if(polygon.extremes.south[1] < globalExtremeSouth[1]) globalExtremeSouth = copy(polygon.extremes.south)
      if(polygon.extremes.west[0] < globalExtremeWest[0]) globalExtremeWest = copy(polygon.extremes.west)
      if(polygon.extremes.east[0] > globalExtremeEast[0]) globalExtremeEast = copy(polygon.extremes.east)
    })
    // Calculate the center
    let globalCenter = [
      (globalExtremeWest[0] + globalExtremeEast[0]) / 2,
      (globalExtremeSouth[1] + globalExtremeNorth[1]) / 2
    ]

    // Assign the extremes
    returnObj.extremes = {
      north: globalExtremeNorth,
      west: globalExtremeWest,
      east: globalExtremeEast,
      south: globalExtremeSouth,
      center: globalCenter
    }

    // Calculate the total area
    let globalArea = 0;
    returnObj.polygons.forEach((i) => globalArea += i.area);
    returnObj.area = globalArea;

    /*
      Transform all coordinates, if applicable
    */
    // If the EPSG.code is 4326 it is in WGS 84 (Long/Lat) format, no transformation is required https://epsg.io/4326
    if(EPSG.code === 'EPSG:4326') {
      returnObj.transformedExtremes = returnObj.extremes;
      returnObj.transformedPolygons = returnObj.polygons;
      return returnObj;
    }

    if(EPSG.code) {
      // Transform the global extremes
      let transformedExtremes = {
        north:  reverseXY(proj4(EPSG.code, 'EPSG:4326', copy(globalExtremeNorth))),
        west:   reverseXY(proj4(EPSG.code, 'EPSG:4326', copy(globalExtremeWest))),
        east:   reverseXY(proj4(EPSG.code, 'EPSG:4326', copy(globalExtremeEast))),
        south:  reverseXY(proj4(EPSG.code, 'EPSG:4326', copy(globalExtremeSouth))),
        center: reverseXY(proj4(EPSG.code, 'EPSG:4326', copy(globalCenter)))
      }
      // Set the extremes
      returnObj.transformedExtremes = transformedExtremes;
      
      // Transform the polygons
      let transformedPolygons = JSON.parse(JSON.stringify(returnObj.polygons));
      transformedPolygons.forEach((polygon) => {
        // Transform the vertices
        polygon.vertices.forEach((vertice, i) => {
          polygon.vertices[i] = reverseXY(proj4(EPSG.code, options.toProj4Projection, copy(vertice)));
        })
        
        // Transform the polygon extremes
        polygon.extremes = {
          north:  reverseXY(proj4(EPSG.code, options.toProj4Projection, copy(polygon.extremes.north))),
          west:   reverseXY(proj4(EPSG.code, options.toProj4Projection, copy(polygon.extremes.west))),
          east:   reverseXY(proj4(EPSG.code, options.toProj4Projection, copy(polygon.extremes.east))),
          south:  reverseXY(proj4(EPSG.code, options.toProj4Projection, copy(polygon.extremes.south))),
          center: reverseXY(proj4(EPSG.code, options.toProj4Projection, copy(polygon.extremes.center))),
        }
        
        // Calculate the area of the polygon
        let tp = turfPolygon([copy(polygon.vertices)])
        let area = turfArea(tp);
        polygon.area = area;
      })
      returnObj.transformedPolygons = transformedPolygons;
    }

    return returnObj;
  }
}

export default new PolyParser();