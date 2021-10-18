import { rest } from 'msw'

export default [
    rest.post('*/api/v1/matrikkelenheter', (req, res, ctx) => {
        return res(ctx.json(require('./data/MatrikkelEnhetIDs.json')));
    }),
    rest.post('*/api/v1/store', (req, res, ctx) => {
        if(!req.body) { res(ctx.json( { message: 'No body specified' })) }
        if(!Array.isArray(req.body)) { req.body = [req.body]; }

        if(req.body[0].type === 'MatrikkelenhetId') {
            return res(ctx.json(require('./data/MatrikkelEnheter.json')));
        } else if(req.body[0].type === 'PersonId') {
            return res(ctx.json(require('./data/PersonerIBø.json')));
        }
    })
]