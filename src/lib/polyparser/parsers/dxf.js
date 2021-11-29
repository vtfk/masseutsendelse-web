/*
  Import dependencies
*/
import AppError from '../../vtfk-errors/AppError'
import dxfParser from 'dxf-parser'

export function parse(text) {
  try {
    // The array of polygons to return
    let polygonArray = [];
    // Create the parser
    const parser = new dxfParser();

    // Parse the file
    const parsed = parser.parseSync(text);

    // Validate that the file contains entities
    if(!parsed.entities) { throw new AppError('The file contains no shapes', 'We were unable to find any shapes in the file') }

    // Retreive polygons from the file
    let polygons = parsed.entities.filter((i => i.type === 'LWPOLYLINE'));
    if(polygons.length === 0) { throw new AppError('No polygons in file', `We were able to find ${parsed.entities.length} shapes in the file, but none are polygons`) }

    // Verify that all polygons have segments
    polygons.forEach(polygon => {
      // Make sure that the polygon has vertices
      if(!polygon.vertices || !Array.isArray(polygon.vertices) || polygon.vertices.length <= 0) throw new AppError('Polygon is missing vertices', `One or more polygons in the file contains no vertices`)
      // Get all vertices
      let vertices = [];
      polygon.vertices.forEach((v) => {
        vertices.push([v.x, v.y]);
      })
      // Get the metadata from
      let metadata = {...polygon};
      delete metadata.vertices;

      // Push the vertices to polygonArray
      polygonArray.push({
        metadata,
        vertices
      });
    });

    // Get the metadata from the polygon

    return polygonArray;
  } catch (err) {
    throw new AppError(err.title || 'Error', err.message);
  }
}