import { rest } from 'msw'

export default [
    rest.post('*/api/v1/matrikkelenheter', (req, res, ctx) => {
        return res(ctx.json(require('./data/MatrikkelEnhetIDs.json')));
    }),
    rest.post('*/api/v1/store', (req, res, ctx) => {
        if(req.body && Array.isArray(req.body)) {
            if(req.body[0].type === 'MatrikkelenhetId') {
                return res(ctx.json(require('./data/MatrikkelEnheter.json')));
            }
        }
    })
]