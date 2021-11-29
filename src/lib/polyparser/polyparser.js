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

/*
  Class
*/
class PolyParser {
  /**
   * 
   * @param {HTMLFile} file A file uploaded to a input-field
   * @param {object} options 
   * @param {boolean} options.inverseXY Should the X and Y coordinates switch places?
   * @param {array} options.fromProj4Projection Proj4 projection string to transform from
   * @param {string} options.toProj4Projection Proj4 projection string to transform to
   * 
   */
  async parse(
    file,
    options = {
      inverseXY: false,
      fromProj4Projection: '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs',
      toProj4Projection: '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'
    })
    {
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

    parsedData.forEach((polygon) => {
      // Make sure that the polygon contains vertices and that they are self-closing
      if(!polygon.vertices || !Array.isArray(polygon.vertices) || polygon.vertices.length === 0) throw new AppError('Polygon is empty', 'One or more polygons in the file is empty');
      if(polygon.vertices[0] != polygon.vertices[polygon.vertices.length]) {
        polygon.vertices.push(polygon.vertices[0]);
      }

      // If applicable, swap the x and y coordinates before proceeding
      if(options.inverseXY) {
        polygon.vertices.forEach((vertice) => {
          const tmpX = vertice[0]
          vertice[0] = vertice[1];
          vertice[1] = tmpX;
        })
      }
      
      // Validate and calculate the extreme points for the vertices
      let extremeNorth = [polygon.vertices[0][0], polygon.vertices[1][1]];
      let extremeWest = [polygon.vertices[0][0], polygon.vertices[1][1]];
      let extremeEast = [polygon.vertices[0][0], polygon.vertices[1][1]];
      let extremeSouth = [polygon.vertices[0][0], polygon.vertices[1][1]];

      polygon.vertices.forEach((vertice, i) => {
        // Make sure that all of the vertices in the polygon is in [x, y] format
        if(!vertice || vertice.length < 2) throw new AppError('Vertice is incomplete', `The vertice in position ${i} contains only ${vertice.length} coordinates`, [vertice]);
        if(typeof vertice[0] !== 'number' || typeof vertice[1] !== 'number') throw new AppError('Vertice is invalid', `The vertice in position ${i} contains coordinates that are not numbers`, [vertice]);
        
        // Check if this vertice is one of the extremes
        if(vertice[0] < extremeWest[0]) extremeWest = vertice;
        else if(vertice[0] > extremeEast) extremeEast = vertice;
        if(vertice[1] > extremeNorth[0]) extremeNorth = vertice;
        else if(vertice[1] < extremeSouth) extremeSouth = vertice;
      })

      // Check that the polygon has atleast 4 points
      if(polygon.vertices.length < 4) throw new AppError('Polygon has to few vertices', `One of the polygons has only ${polygon.vertices.length} it needs atleast 4`);

      // Calculate the centerpoints
      const center = [
        (extremeWest[0] + extremeEast[0]) / 2,
        (extremeSouth[1] + extremeNorth[1]) / 2
      ]

      // Calculate the area of the polygon
      let tp = turfPolygon([polygon.vertices])
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
    let globalExtremeNorth = [returnObj.polygons[0].extremes.north[0], returnObj.polygons[0].extremes.north[1]]
    let globalExtremeWest = [returnObj.polygons[0].extremes.west[0], returnObj.polygons[0].extremes.west[1]]
    let globalExtremeEast = [returnObj.polygons[0].extremes.east[0], returnObj.polygons[0].extremes.east[1]]
    let globalExtremeSouth = [returnObj.polygons[0].extremes.south[0], returnObj.polygons[0].extremes.south[1]]
    // Attempt to find extremer extremes
    returnObj.polygons.forEach((polygon) => {
      if(globalExtremeNorth[1] > polygon.extremes.north[1]) globalExtremeNorth = [polygon.extremes.north[0], polygon.extremes.north[1]]
      else if(globalExtremeSouth[1] < polygon.extremes.south[1]) globalExtremeSouth = [polygon.extremes.south[0], polygon.extremes.south[1]]
      if(globalExtremeWest[1] < polygon.extremes.west[1]) globalExtremeWest = [polygon.extremes.west[0], polygon.extremes.west[1]]
      else if (globalExtremeEast[1] < polygon.extremes.east[1]) globalExtremeEast = [polygon.extremes.east[0], polygon.extremes.east[1]]
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
      Transform all coordinates
    */
    if(options.fromProj4Projection && options.toProj4Projection) {
      console.log('Transforming coordinates');
      
      // Transform the global extremes
      let transformedExtremes = {
        north: proj4(options.fromProj4Projection, options.toProj4Projection, [globalExtremeNorth[0], globalExtremeNorth[1]]),
        west: proj4(options.fromProj4Projection, options.toProj4Projection, [globalExtremeWest[0], globalExtremeWest[1]]),
        east: proj4(options.fromProj4Projection, options.toProj4Projection, [globalExtremeEast[0], globalExtremeEast[1]]),
        south: proj4(options.fromProj4Projection, options.toProj4Projection, [globalExtremeSouth[0], globalExtremeSouth[1]]),
        center: proj4(options.fromProj4Projection, options.toProj4Projection, [globalCenter[0], globalCenter[1]])
      }
      // Set the extremes
      returnObj.transformedExtremes = transformedExtremes;
      
      // Transform the polygons
      let transformedPolygons = JSON.parse(JSON.stringify(returnObj.polygons));
      transformedPolygons.forEach((polygon) => {
        // Transform the polygon extremes
        polygon.extremes = {
          north: proj4(options.fromProj4Projection, options.toProj4Projection, [polygon.extremes.north[0], polygon.extremes.north[1]]),
          west: proj4(options.fromProj4Projection, options.toProj4Projection, [polygon.extremes.west[0], polygon.extremes.west[1]]),
          east: proj4(options.fromProj4Projection, options.toProj4Projection, [polygon.extremes.east[0], polygon.extremes.east[1]]),
          south: proj4(options.fromProj4Projection, options.toProj4Projection, [polygon.extremes.south[0], polygon.extremes.south[1]]),
          center: proj4(options.fromProj4Projection, options.toProj4Projection, [polygon.extremes.center[0], polygon.extremes.center[1]]),
        }
        // Transform the vertices
        polygon.vertices.forEach((vertice, i) => {
          polygon.vertices[i] = proj4(options.fromProj4Projection, options.toProj4Projection, [vertice[0], vertice[1]])
        })
        // Calculate the area of the polygon
        let tp = turfPolygon([polygon.vertices])
        let area = turfArea(tp);
        polygon.area = area;
      })
      returnObj.transformedPolygons = transformedPolygons;
    }

    return returnObj;
  }
}

export default new PolyParser();